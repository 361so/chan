<template>
  <view class="container">
    <view class="content">
      <view class="title">用户隐私及服务内容</view>
      
      <view class="section">
        <view class="h3">1. 特别提示</view>
        <view class="p">在此特别提醒您（用户）在注册成为用户之前，请认真阅读本《用户协议》（以下简称“协议”），确保您充分理解本协议中各条款。请您审慎阅读并选择接受或不接受本协议。除非您接受本协议所有条款，否则您无权注册、登录或使用本协议所涉服务。您的注册、登录、使用等行为将视为对本协议的接受，并同意接受本协议各项条款的约束。</view>
      </view>
      
      <view class="section">
        <view class="h3">2. 账号注册与登录</view>
        <view class="p">2.1 本平台采用微信一键登录方式，用户无需提供手机号码即可注册和使用本服务。您的微信OpenID将作为您在本平台的唯一身份标识。</view>
        <view class="p">2.2 您可以自主设置和修改您的昵称和头像，这些信息将用于在平台内展示（如排行榜、个人中心等）。</view>
        <view class="p">2.3 如果注册申请者有被封禁的先例或涉嫌虚假注册及滥用他人名义注册，及其他不能得到许可的理由，我们将拒绝其注册申请。</view>
      </view>
      
      <view class="section">
        <view class="h3">3. 用户隐私保护</view>
        <view class="p">3.1 用户在注册账号或使用本服务的过程中，可能需要填写或提交一些必要的信息。如用户提交的信息不完整或不符合法律法规的规定，则用户可能无法使用本服务或在使用本服务的过程中受到限制。</view>
        <view class="p">3.2 本平台严格保护用户隐私，不会强制收集用户的手机号码、真实姓名、身份证号等敏感个人信息。我们仅收集必要的公开信息（如昵称、头像）以及您的上报记录用于提供服务。</view>
        <view class="p">3.3 尊重用户个人隐私信息的私有性是本服务的一贯制度，我们将会采取合理的措施保护用户的个人隐私信息，除法律或本协议另有规定外，我们将对用户个人隐私信息保密。</view>
      </view>
      
      <view class="section">
        <view class="h3">4. 用户行为规范</view>
        <view class="p">用户同意将不会利用本服务进行任何违法或不正当的活动，包括但不限于下列行为：</view>
        <view class="p">4.1 上载、展示、张贴、传播或以其它方式传送含有下列内容之一的信息：</view>
        <view class="p">1) 反对宪法所确定的基本原则的；</view>
        <view class="p">2) 危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的；</view>
        <view class="p">3) 损害国家荣誉和利益的；</view>
        <view class="p">4) 煽动民族仇恨、民族歧视、破坏民族团结的；</view>
        <view class="p">5) 破坏国家宗教政策，宣扬邪教和封建迷信的；</view>
        <view class="p">6) 散布谣言，扰乱社会秩序，破坏社会稳定的；</view>
        <view class="p">7) 散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的；</view>
        <view class="p">8) 侮辱或者诽谤他人，侵害他人合法权利的；</view>
        <view class="p">9) 含有虚假、有害、胁迫、侵害他人隐私、骚扰、侵害、中伤、粗俗、猥亵、或其它道德上令人反感的内容；</view>
        <view class="p">10) 含有中国法律、法规、规章、条例以及任何具有法律效力之规范所限制或禁止的其它内容的。</view>
      </view>
      
      <view class="section">
        <view class="h3">5. 服务的变更、中断或终止</view>
        <view class="p">5.1 鉴于网络服务的特殊性，用户同意我们有权随时变更、中断或终止部分或全部的网络服务。</view>
        <view class="p">5.2 如发生下列任何一种情形，我们有权随时中断或终止向用户提供本协议项下的服务而无需对用户或任何第三方承担任何责任：</view>
        <view class="p">1) 用户提供的个人资料不真实；</view>
        <view class="p">2) 用户违反本协议中规定的使用规则；</view>
      </view>
    </view>
  </view>
</template>

<script setup>
</script>

<style lang="scss">
.container {
  padding: 20px;
  background-color: #fff;
  min-height: 100vh;
}

.title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.section {
  margin-bottom: 25px;
  
  .h3 {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
  }
  
  .p {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 8px;
    text-align: justify;
  }
}
</style>
