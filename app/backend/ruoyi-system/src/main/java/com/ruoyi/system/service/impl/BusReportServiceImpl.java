package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.common.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.BusReportMapper;
import com.ruoyi.system.mapper.SysUserMapper;
import com.ruoyi.system.domain.BusReport;
import com.ruoyi.system.service.IBusReportService;
import com.ruoyi.common.core.domain.entity.SysUser;

/**
 * 上报记录Service业务层处理
 * 
 * @author ruoyi
 */
@Service
public class BusReportServiceImpl implements IBusReportService 
{
    @Autowired
    private BusReportMapper busReportMapper;

    @Autowired
    private SysUserMapper userMapper;

    /**
     * 查询上报记录
     * 
     * @param id 上报记录主键
     * @return 上报记录
     */
    @Override
    public BusReport selectBusReportById(Long id)
    {
        return busReportMapper.selectBusReportById(id);
    }

    /**
     * 查询上报记录列表
     * 
     * @param busReport 上报记录
     * @return 上报记录
     */
    @Override
    public List<BusReport> selectBusReportList(BusReport busReport)
    {
        return busReportMapper.selectBusReportList(busReport);
    }

    /**
     * 新增上报记录
     * 
     * @param busReport 上报记录
     * @return 结果
     */
    @Override
    public int insertBusReport(BusReport busReport)
    {
        // 校验图片数量
        String images = busReport.getImages();
        if (images == null || images.trim().isEmpty()) {
            throw new RuntimeException("请上传至少3张照片(发现/清理中/清理后)");
        }
        // 假设图片URL以逗号分隔
        String[] imageUrls = images.split(",");
        if (imageUrls.length < 3) {
            throw new RuntimeException("请上传至少3张照片(发现/清理中/清理后)");
        }

        // 频率限制：检查用户最近一次上报时间
        if (busReport.getCreateBy() != null) {
            BusReport lastReport = busReportMapper.selectLastReportByUserName(busReport.getCreateBy());
            if (lastReport != null && lastReport.getCreateTime() != null) {
                long diff = System.currentTimeMillis() - lastReport.getCreateTime().getTime();
                if (diff < 30 * 1000) { // 30秒内禁止重复上报
                    throw new RuntimeException("上报过于频繁，请30秒后再试");
                }
            }
        }
        
        busReport.setCreateTime(DateUtils.getNowDate());
        // 初始状态为0（待审核）
        if (busReport.getStatus() == null) {
            busReport.setStatus("0");
        }
        return busReportMapper.insertBusReport(busReport);
    }

    /**
     * 修改上报记录
     * 
     * @param busReport 上报记录
     * @return 结果
     */
    @Override
    public int updateBusReport(BusReport busReport)
    {
        // 审核逻辑：如果状态变更为"1"（已审核/已清理），则给用户加积分
        // 获取旧数据
        BusReport oldReport = busReportMapper.selectBusReportById(busReport.getId());
        if (oldReport != null && busReport.getStatus() != null) {
            // 如果旧状态不是1，新状态是1，说明是审核通过
            if (!"1".equals(oldReport.getStatus()) && "1".equals(busReport.getStatus())) {
                try {
                    String username = oldReport.getCreateBy();
                    SysUser user = userMapper.selectUserByUserName(username);
                    if (user != null) {
                        Long currentPoints = user.getPoints() == null ? 0L : user.getPoints();
                        user.setPoints(currentPoints + 10);
                        userMapper.updateUser(user);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
        
        busReport.setUpdateTime(DateUtils.getNowDate());
        return busReportMapper.updateBusReport(busReport);
    }

    /**
     * 批量删除上报记录
     * 
     * @param ids 需要删除的上报记录主键
     * @return 结果
     */
    @Override
    public int deleteBusReportByIds(Long[] ids)
    {
        return busReportMapper.deleteBusReportByIds(ids);
    }

    /**
     * 删除上报记录信息
     * 
     * @param id 上报记录主键
     * @return 结果
     */
    @Override
    public int deleteBusReportById(Long id)
    {
        return busReportMapper.deleteBusReportById(id);
    }
}
