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
    if (method === 'POST') return handleAddReport(data, OPENID)
    if (method === 'GET' && url.includes('/list')) return handleListReport(data, OPENID)
    // if (method === 'GET') return handleGetReport(url, OPENID) // Detail
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
  
  // 如果不是管理员，只能看自己的
  const isAdmin = await checkAdmin(openid)
  if (!isAdmin) {
      where.openid = openid
  } else if (query.openid) {
      // 管理员也可以指定看某人的
      where.openid = query.openid
  }
  
  // 支持状态筛选
  if (query.status) {
      where.status = query.status
  }

  // 简单列表查询
  const res = await db.collection('reports')
    .where(where)
    .orderBy('createTime', 'desc')
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
        auditor: openid
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
  // 可以根据 status 排序，让待审核的排在前面
  const res = await db.collection('reports')
    .orderBy('status', 'asc') // 0(待审核) -> 1(已通过) -> 2(已驳回)
    .orderBy('createTime', 'desc')
    .get()
    
  return {
    code: 200,
    rows: res.data
  }
}