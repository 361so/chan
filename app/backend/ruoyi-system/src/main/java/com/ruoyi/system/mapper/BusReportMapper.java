package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.BusReport;

/**
 * 上报记录Mapper接口
 * 
 * @author ruoyi
 */
public interface BusReportMapper 
{
    /**
     * 查询上报记录
     * 
     * @param id 上报记录主键
     * @return 上报记录
     */
    public BusReport selectBusReportById(Long id);

    /**
     * 查询上报记录列表
     * 
     * @param busReport 上报记录
     * @return 上报记录集合
     */
    public List<BusReport> selectBusReportList(BusReport busReport);

    /**
     * 新增上报记录
     * 
     * @param busReport 上报记录
     * @return 结果
     */
    public int insertBusReport(BusReport busReport);

    /**
     * 修改上报记录
     * 
     * @param busReport 上报记录
     * @return 结果
     */
    public int updateBusReport(BusReport busReport);

    /**
     * 删除上报记录
     * 
     * @param id 上报记录主键
     * @return 结果
     */
    public int deleteBusReportById(Long id);

    /**
     * 批量删除上报记录
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteBusReportByIds(Long[] ids);

    /**
     * 查询用户上报数量
     * 
     * @param userName 用户名
     * @return 数量
     */
    public int selectReportCountByUserName(String userName);

    /**
     * 查询用户最近一次上报记录
     * 
     * @param userName 用户名
     * @return 结果
     */
    public BusReport selectLastReportByUserName(String userName);
}
