const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const badgesDir = path.join(__dirname, '../src/static/badges');

// 确保目录存在
if (!fs.existsSync(badgesDir)) {
  fs.mkdirSync(badgesDir, { recursive: true });
}

// 勋章配置
const badges = [
  { id: '001', name: '新手', color: '#52c41a', icon: '新', gradient: ['#73d13d', '#52c41a'] },
  { id: '002', name: '青铜', color: '#cd7f32', icon: '铜', gradient: ['#e89b4f', '#cd7f32'] },
  { id: '003', name: '白银', color: '#c0c0c0', icon: '银', gradient: ['#e0e0e0', '#c0c0c0'] },
  { id: '004', name: '黄金', color: '#ffd700', icon: '金', gradient: ['#ffeb3b', '#ffd700'] },
  { id: '005', name: '钻石', color: '#00bcd4', icon: '钻', gradient: ['#26c6da', '#00bcd4'] },
  { id: '006', name: '王者', color: '#9c27b0', icon: '王', gradient: ['#ab47bc', '#9c27b0'] },
  { id: '007', name: '荣耀', color: '#ff5722', icon: '荣', gradient: ['#ff7043', '#ff5722'] },
  { id: '008', name: '传说', color: '#e91e63', icon: '传', gradient: ['#f06292', '#e91e63'] },
  { id: '009', name: '至尊', color: '#673ab7', icon: '尊', gradient: ['#7e57c2', '#673ab7'] },
  { id: '010', name: '永恒', color: '#3f51b5', icon: '永', gradient: ['#5c6bc0', '#3f51b5'] },
  { id: '011', name: '星辰', color: '#2196f3', icon: '星', gradient: ['#42a5f5', '#2196f3'] },
  { id: '012', name: '月光', color: '#607d8b', icon: '月', gradient: ['#78909c', '#607d8b'] },
];

function createBadgeImage(badge) {
  const size = 200;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 清空画布
  ctx.clearRect(0, 0, size, size);

  // 绘制外圈发光效果
  const glowGradient = ctx.createRadialGradient(size/2, size/2, size/2 - 20, size/2, size/2, size/2);
  glowGradient.addColorStop(0, badge.color + '40');
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();

  // 绘制外圈边框
  const borderGradient = ctx.createLinearGradient(0, 0, size, size);
  borderGradient.addColorStop(0, badge.gradient[0]);
  borderGradient.addColorStop(1, badge.gradient[1]);
  ctx.fillStyle = borderGradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 8, 0, Math.PI * 2);
  ctx.fill();

  // 绘制内圈背景
  const innerGradient = ctx.createRadialGradient(size/2, size/2 - 20, 0, size/2, size/2, size/2 - 20);
  innerGradient.addColorStop(0, badge.gradient[0]);
  innerGradient.addColorStop(1, badge.gradient[1]);
  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 15, 0, Math.PI * 2);
  ctx.fill();

  // 绘制高光效果
  const shineGradient = ctx.createLinearGradient(0, 0, size, size);
  shineGradient.addColorStop(0, 'rgba(255,255,255,0.4)');
  shineGradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  shineGradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shineGradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 15, Math.PI * 1.2, Math.PI * 1.8);
  ctx.lineTo(size/2, size/2);
  ctx.closePath();
  ctx.fill();

  // 绘制文字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(badge.icon, size/2, size/2);

  // 保存图片
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(badgesDir, `badge_${badge.id}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated: badge_${badge.id}.png - ${badge.name}`);
}

// 生成所有勋章
badges.forEach(badge => {
  createBadgeImage(badge);
});

console.log('\nAll badges generated successfully!');
console.log(`Output directory: ${badgesDir}`);
