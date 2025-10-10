/**
 * 快速设置脚本
 * 帮助用户创建和配置 .env 文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Bumpin 网格交易策略 - 快速设置\n');
console.log('='.repeat(70));

// 检查 .env 文件是否存在
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
    console.log('\n⚠️  .env 文件已存在！');
    console.log('如果需要重新配置，请先删除现有的 .env 文件\n');
    process.exit(0);
}

// 检查 env.example 文件
if (!fs.existsSync(envExamplePath)) {
    console.error('❌ 找不到 env.example 文件！');
    process.exit(1);
}

// 复制 env.example 到 .env
try {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ 已创建 .env 文件！');
    console.log(`   文件路径: ${envPath}\n`);
    
    console.log('📝 下一步操作:\n');
    console.log('1. 打开 .env 文件');
    console.log('2. 填入你的 API_KEY 和 SECRET_KEY');
    console.log('3. 根据需要调整其他参数\n');
    
    console.log('示例:');
    console.log('   API_KEY=api_your_actual_key_here');
    console.log('   SECRET_KEY=your_actual_secret_here\n');
    
    console.log('4. 保存文件后运行测试:');
    console.log('   npm run grid-test\n');
    
    console.log('5. 测试通过后启动策略:');
    console.log('   npm run grid\n');
    
    console.log('='.repeat(70));
    console.log('✅ 设置完成！\n');
    
} catch (error) {
    console.error('❌ 创建 .env 文件失败:', error.message);
    process.exit(1);
}

