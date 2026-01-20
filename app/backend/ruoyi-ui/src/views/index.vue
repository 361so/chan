<template>
  <div class="app-container home">
    <el-row :gutter="20">
      <el-col :sm="24" :lg="24" style="text-align: center; margin-top: 100px;">
        <h1 style="font-size: 48px; color: #409EFF;">欢迎使用“铲泡屎”后台管理系统</h1>
        <p style="font-size: 20px; color: #666; margin-top: 20px;">
          致力于改善城市环境，共建文明社区
        </p>
        <img src="@/assets/logo/logo.png" style="width: 200px; margin-top: 40px;" />
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "Index"
}
</script>

<style scoped lang="scss">
.home {
  height: 100%;
  background-color: #fff;
}
</style>

