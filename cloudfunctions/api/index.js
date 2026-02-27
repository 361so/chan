// index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { url, method, data, token } = event
  const wxContext = cloud.getWXContext()
  const OPENID = wxContext.OPENID

  console.log('Request:', method, url, data, OPENID)

  // 1. 登录 (WeChat Login)
  if (url === '/wechat/login') {
    return handleWechatLogin(OPENID)
  }
  
  // 2. 账号密码登录 (模拟，云开发通常推荐微信一键登录)
  if (url === '/login') {
      // 简单模拟，实际应查数据库
      return handleAccountLogin(data)
  }

  // 3. 获取用户信息
  if (url === '/getInfo') {
    return handleGetInfo(OPENID)
  }

  // 4. 上报相关
  if (url.startsWith('/system/report')) {
    if (method === 'POST' && url === '/system/report') return handleAddReport(data, OPENID)
    if (method === 'POST' && url === '/system/report/like') return handleLikeReport(data, OPENID)
    if (method === 'POST' && url === '/system/report/delete') return handleDeleteReport(data, OPENID) // 允许用户调用删除
    if (method === 'GET' && url.includes('/list')) return handleListReport(data, OPENID)
    if (method === 'GET' && url.includes('/detail')) {
        // 提取 ID: /system/report/detail/{id}
        const parts = url.split('/detail/')
        if (parts.length > 1) {
             const id = parts[1].trim() // 去除可能存在的空白字符
             console.log('Extract ID:', id, 'Length:', id.length, 'from URL:', url)
             return handleGetReportDetail(id, OPENID)
        }
    }
  }
  
  // 5. 排行榜
  if (url.startsWith('/system/user/rank')) {
      return handleRank(url)
  }

  // 6. 管理员审核
  if (url === '/admin/report/audit') {
    return handleAuditReport(data, OPENID)
  }
  
  // 7. 管理员获取待审核列表
  if (url === '/admin/report/list') {
    return handleAdminListReport(data, OPENID)
  }
  
  // 9. 管理员删除上报
  if (url === '/admin/report/delete') {
    return handleDeleteReport(data, OPENID)
  }

  // 8. 用户更新信息
  if (url === '/user/update') {
    return handleUpdateUser(data, OPENID)
  }

  return {
    code: 404,
    msg: 'Not Found: ' + url
  }
}

// --- Handlers ---

async function handleGetReportDetail(id, openid) {
  try {
    console.log('Querying report with ID:', id, 'Type:', typeof id)
    
    // 调试：先查一条看看结构
    // const debugRes = await db.collection('reports').limit(1).get()
    // if (debugRes.data.length > 0) {
    //    console.log('Sample report _id:', debugRes.data[0]._id, 'Type:', typeof debugRes.data[0]._id)
    // }

    // 直接尝试 where 查询
    const listRes = await db.collection('reports').where({ _id: id }).get()
    
    if (listRes.data.length === 0) {
        console.log('Report not found for ID:', id)
        // 调试：尝试列出所有 ID 进行对比（仅调试用，生产环境慎用）
        // const allRes = await db.collection('reports').field({_id: true}).get()
        // console.log('All report IDs:', allRes.data.map(item => item._id))
        
        return { code: 404, msg: '记录不存在' }
    }
    
    const report = listRes.data[0]
    console.log('Report found:', report._id)
    
    // 权限检查：
    // 1. 管理员 -> 可见
    // 2. 作者本人 -> 可见
    // 3. 审核通过 -> 可见
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin && report.openid !== openid && report.status !== '1') {
       return { code: 403, msg: '无权查看' }
    }
    
    // 检查是否点赞
    let isLiked = false
    try {
        const likeRes = await db.collection('likes').where({
            reportId: id,
            openid: openid
        }).count()
        isLiked = likeRes.total > 0
    } catch (e) {
        console.warn('Check like status failed (likes collection might not exist):', e)
        // 忽略错误，默认为未点赞
    }
    
    return {
      code: 200,
      data: {
          ...report,
          isLiked: isLiked
      }
    }
  } catch (e) {
    console.error('Get detail failed:', e)
    return { code: 500, msg: '获取详情失败: ' + e.message }
  }
}

async function handleLikeReport(data, openid) {
    const { id, isLike } = data
    const dbCmd = db.command
    
    try {
        if (isLike) {
            // 点赞
            // 1. 检查是否已点赞
            let countRes = { total: 0 }
            try {
                countRes = await db.collection('likes').where({
                    reportId: id,
                    openid: openid
                }).count()
            } catch (e) {
                // 如果集合不存在，尝试创建（云函数无法创建集合，需手动）
                // 这里只能抛出更友好的错误
                 if (e.errCode === -502005) {
                     return { code: 500, msg: '请联系管理员在云数据库创建 "likes" 集合' }
                 }
                 throw e
            }
            
            if (countRes.total === 0) {
                // 2. 添加点赞记录
                await db.collection('likes').add({
                    data: {
                        reportId: id,
                        openid: openid,
                        createTime: new Date()
                    }
                })
                // 3. 增加计数
                await db.collection('reports').doc(id).update({
                    data: {
                        likes: dbCmd.inc(1)
                    }
                })
            }
        } else {
            // 取消点赞
            try {
                const delRes = await db.collection('likes').where({
                    reportId: id,
                    openid: openid
                }).remove()
                
                if (delRes.stats.removed > 0) {
                     // 减少计数
                     await db.collection('reports').doc(id).update({
                        data: {
                            likes: dbCmd.inc(-1)
                        }
                    })
                }
            } catch (e) {
                console.warn('Cancel like failed:', e)
            }
        }
        return { code: 200, msg: '操作成功' }
    } catch (e) {
        console.error(e)
        return { code: 500, msg: '操作失败: ' + (e.msg || e.message) }
    }
}

// 简单硬编码管理员 OpenID，实际生产建议存在数据库 role 字段
const ADMIN_OPENIDS = [
  'ozX-s5...', // 替换为你自己的 OpenID，可以在调试控制台看到
]

async function checkAdmin(openid) {
  // 方式1：硬编码检查
  // if (ADMIN_OPENIDS.includes(openid)) return true
  
  // 方式2：查库检查 role='admin'
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length > 0 && userRes.data[0].role === 'admin') {
    return true
  }
  return false
}

async function handleDeleteReport(data, openid) {
  const { id } = data
  try {
    // 1. 获取记录
    const reportRes = await db.collection('reports').doc(id).get()
    if (!reportRes.data) {
      return { code: 404, msg: '记录不存在' }
    }
    const report = reportRes.data

    // 2. 权限判断
    const isAdmin = await checkAdmin(openid)
    
    // 如果是用户自己删除，必须是待审核状态
    if (!isAdmin) {
      if (report.openid !== openid) {
        return { code: 403, msg: '无权操作' }
      }
      if (report.status !== '0') {
        return { code: 403, msg: '只能删除待审核的记录' }
      }
    }
    
    // 3. 删除上报记录
    await db.collection('reports').doc(id).remove()
    
    // 4. 删除相关的点赞记录 (可选，保持数据清洁)
    try {
        await db.collection('likes').where({ reportId: id }).remove()
    } catch (e) {
        // 忽略 likes 集合不存在的错误
    }
    
    return { code: 200, msg: '删除成功' }
  } catch (e) {
    console.error('Delete report failed:', e)
    return { code: 500, msg: '删除失败: ' + e.message }
  }
}

async function handleUpdateUser(data, openid) {
  try {
    const { nickName, avatarUrl } = data
    const updateData = {}
    if (nickName) updateData.nickName = nickName
    if (avatarUrl) updateData.avatarUrl = avatarUrl
    
    // 如果 token 是 _id，也需要支持。这里简单假设用户已登录且 openid 匹配
    await db.collection('users').where({ openid }).update({
      data: updateData
    })
    
    return { code: 200, msg: '更新成功' }
  } catch (e) {
    console.error(e)
    return { code: 500, msg: '更新失败' }
  }
}

async function handleWechatLogin(openid) {
  // 检查用户是否存在
  const userRes = await db.collection('users').where({ openid }).get()
  
  if (userRes.data.length === 0) {
    // 注册新用户
    await db.collection('users').add({
      data: {
        openid,
        username: '微信用户',
        nickName: '微信用户',
        avatar: '',
        points: 0,
        createTime: new Date(),
        status: '0'
      }
    })
  }
  
  return {
    code: 200,
    token: openid, // 简单使用 openid 作为 token
    msg: '登录成功'
  }
}

async function handleAccountLogin(data) {
    // 简单的账号登录实现，查找 users 集合
    const { username, password } = data
    const userRes = await db.collection('users').where({ username, password }).get()
    
    if (userRes.data.length > 0) {
        return {
            code: 200,
            token: userRes.data[0]._id, // 使用 _id 或 openid
            msg: '登录成功'
        }
    }
    return { code: 500, msg: '账号或密码错误' }
}

async function handleGetInfo(openid) {
  // 如果 token 是 _id (账号登录)
  let userRes = await db.collection('users').where({ openid }).get()
  
  // 兼容账号登录的情况，如果 openid 查不到，尝试用 _id 查
  if (userRes.data.length === 0) {
      userRes = await db.collection('users').doc(openid).get().catch(() => ({ data: null }))
      if (!userRes.data) {
          return { code: 401, msg: '用户不存在' }
      }
  }
  
  const user = userRes.data[0] || userRes.data
  
  // 统计上报数量
  const reportCount = await db.collection('reports').where({ openid: user.openid }).count()
  
  // 计算排名
  // 简单逻辑：查询比当前用户积分高的人数 + 1
  const rankRes = await db.collection('users').where({
    points: _.gt(user.points || 0)
  }).count()
  
  return {
    code: 200,
    user: user,
    reportCount: reportCount.total,
    weeklyRank: rankRes.total + 1
  }
}

async function handleAddReport(data, openid) {
  await db.collection('reports').add({
    data: {
      ...data,
      openid,
      createTime: new Date(),
      status: '0' // 0=Pending
    }
  })
  return { code: 200, msg: '上报成功' }
}

async function handleListReport(query, openid) {
  const dbCmd = db.command
  let where = {}
  
  // 逻辑调整：
  // 1. 如果指定了 status='1' (审核通过)，则所有人可见 (首页地图、广场)
  // 2. 如果没有指定 status，则认为是用户查看自己的历史记录 (需要 openid 过滤)
  // 3. 管理员可以查看所有 (但通常管理员走 handleAdminListReport)
  
  if (query.status === '1') {
      where.status = '1'
      // 修正：如果前端显式传了 openid (查某人的/自己的)，则加上 openid 限制
      // 这样积分记录页面可以只查自己的，而广场/地图不传 openid 则查所有人的
      if (query.openid) {
          where.openid = query.openid
      }
  } else {
      // 默认查看自己的
      const isAdmin = await checkAdmin(openid)
      if (!isAdmin) {
          where.openid = openid
      } else if (query.openid) {
          // 管理员也可以指定看某人的
          where.openid = query.openid
      }
      
      // 如果查询参数里有 status (例如查自己的待审核记录)，也加上
      if (query.status) {
          where.status = query.status
      }
  }
  
  // 支持 _id 查询 (详情页复用)
  if (query._id) {
      where._id = query._id
      // 如果查详情，也不应该受 openid 限制 (或者在详情接口里做权限校验)
      // 这里如果传入了 _id，我们可以放宽 openid 限制，
      // 因为 handleGetReportDetail 已经有更细致的权限检查逻辑了，
      // 但这里 handleListReport 是通用列表接口。
      // 为了安全，如果是查 _id，且不是 status=1，还是应该保持上面的 openid 限制逻辑?
      // 实际上详情页现在走 handleGetReportDetail，这里主要是 list
      delete where.openid // 如果是查特定 ID，通常是详情回退逻辑，暂时去掉 openid 限制
  }

  // 简单列表查询
  const orderBy = query.orderByColumn || 'createTime'
  const orderType = query.isAsc || 'desc'

  const res = await db.collection('reports')
    .where(where)
    .orderBy(orderBy, orderType)
    .get()
    
  return {
    code: 200,
    rows: res.data,
    total: res.data.length
  }
}

async function handleRank(url) {
    // 简单的模拟排行
    const res = await db.collection('users')
        .orderBy('points', 'desc')
        .limit(10)
        .get()
        
    return {
        code: 200,
        rows: res.data
    }
}

async function handleAuditReport(data, openid) {
  const isAdmin = await checkAdmin(openid)
  if (!isAdmin) {
    return { code: 403, msg: '无权操作' }
  }

  const { id, status, remark, points } = data
  // id 是记录的 _id
  
  try {
    const reportRes = await db.collection('reports').doc(id).get()
    const report = reportRes.data
    
    // 更新状态
    await db.collection('reports').doc(id).update({
      data: {
        status: status, // '1'=通过, '2'=驳回
        remark: remark || '',
        auditTime: new Date(),
        auditor: openid,
        awardedPoints: status === '1' ? points : 0 // 记录获得的积分
      }
    })
    
    // 如果审核通过，给用户加分
    if (status === '1' && points > 0) {
      const targetOpenid = report.openid
      // 原子操作自增
      await db.collection('users').where({ openid: targetOpenid }).update({
        data: {
          points: _.inc(points)
        }
      })
    }
    
    return { code: 200, msg: '审核完成' }
  } catch (e) {
    console.error(e)
    return { code: 500, msg: '操作失败' }
  }
}

async function handleAdminListReport(data, openid) {
  const isAdmin = await checkAdmin(openid)
  if (!isAdmin) {
    return { code: 403, msg: '无权操作' }
  }
  
  // 查询待审核的
  // const res = await db.collection('reports')
  //   .where({ status: '0' })
  //   .orderBy('createTime', 'desc')
  //   .get()
  
  // 改为查询所有，以便查看历史记录
  // 按照创建时间倒序排列，最新的在最上面
  const res = await db.collection('reports')
    .orderBy('createTime', 'desc')
    .get()
    
  return {
    code: 200,
    rows: res.data
  }
}