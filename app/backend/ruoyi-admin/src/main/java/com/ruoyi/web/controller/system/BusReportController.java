package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.BusReport;
import com.ruoyi.system.service.IBusReportService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

import com.ruoyi.common.annotation.RateLimiter;
import com.ruoyi.common.enums.LimitType;

/**
 * 上报记录Controller
 * 
 * @author ruoyi
 */
@RestController
@RequestMapping("/system/report")
public class BusReportController extends BaseController
{
    @Autowired
    private IBusReportService busReportService;

    /**
     * 查询上报记录列表
     */
    @GetMapping("/list")
    public TableDataInfo list(BusReport busReport)
    {
        startPage();
        List<BusReport> list = busReportService.selectBusReportList(busReport);
        return getDataTable(list);
    }

    /**
     * 导出上报记录列表
     */
    @Log(title = "上报记录", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, BusReport busReport)
    {
        List<BusReport> list = busReportService.selectBusReportList(busReport);
        ExcelUtil<BusReport> util = new ExcelUtil<BusReport>(BusReport.class);
        util.exportExcel(response, list, "上报记录数据");
    }

    /**
     * 获取上报记录详细信息
     */
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(busReportService.selectBusReportById(id));
    }

    /**
     * 新增上报记录
     */
    @Log(title = "上报记录", businessType = BusinessType.INSERT)
    @RateLimiter(key = "report", time = 10, count = 1, limitType = LimitType.IP)
    @PostMapping
    public AjaxResult add(@RequestBody BusReport busReport)
    {
        busReport.setCreateBy(getUsername());
        return toAjax(busReportService.insertBusReport(busReport));
    }

    /**
     * 修改上报记录
     */
    @Log(title = "上报记录", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody BusReport busReport)
    {
        busReport.setUpdateBy(getUsername());
        return toAjax(busReportService.updateBusReport(busReport));
    }

    /**
     * 删除上报记录
     */
    @Log(title = "上报记录", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(busReportService.deleteBusReportByIds(ids));
    }
}
