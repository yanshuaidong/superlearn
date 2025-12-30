const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const BOOK_ID = '286061';
const START_CHAPTER = 1;
const END_CHAPTER = 1000;
const OUTPUT_FILE = '晋末长剑.txt';
const CONCURRENCY = 10; // 并发数
const DELAY_MS = 100; // 每批次间隔

// 请求选项
const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
  }
};

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 并发控制器
async function asyncPool(poolLimit, array, iteratorFn) {
  const results = [];
  const executing = [];
  
  for (const [index, item] of array.entries()) {
    const p = Promise.resolve().then(() => iteratorFn(item, index));
    results.push(p);
    
    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  
  return Promise.all(results);
}

// 获取章节HTML
function fetchChapter(chapterNum) {
  return new Promise((resolve, reject) => {
    const url = `https://wap.qishupu.com/book/${BOOK_ID}_${chapterNum}.html`;
    
    https.get(url, options, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// 解析章节内容
function parseChapter(html) {
  // 提取标题
  const titleMatch = html.match(/<div class="nr_title"[^>]*>\s*([^<]+)\s*<\/div>/);
  const title = titleMatch ? titleMatch[1].trim() : '未知标题';
  
  // 提取正文内容 - 在<div id="nr1">和加入书签之间
  const contentMatch = html.match(/<div id="nr1">([\s\S]*?)<div style="text-align:center/);
  if (!contentMatch) {
    return { title, content: '' };
  }
  
  // 提取所有<p>标签中的文本
  const paragraphs = contentMatch[1].match(/<p>([^<]*)<\/p>/g) || [];
  const content = paragraphs
    .map(p => p.replace(/<\/?p>/g, '').trim())
    .filter(p => p.length > 0)
    .join('\n\n');
  
  return { title, content };
}

// 主函数
async function main() {
  const outputPath = path.join(__dirname, OUTPUT_FILE);
  
  console.log(`开始爬取《晋末长剑》第${START_CHAPTER}章到第${END_CHAPTER}章...`);
  console.log(`并发数: ${CONCURRENCY}`);
  console.log(`输出文件: ${outputPath}\n`);
  
  const chapters = [];
  for (let i = START_CHAPTER; i <= END_CHAPTER; i++) {
    chapters.push(i);
  }
  
  const results = new Map(); // 存储结果，保持顺序
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();
  
  // 并发爬取
  await asyncPool(CONCURRENCY, chapters, async (chapterNum) => {
    try {
      const html = await fetchChapter(chapterNum);
      const { title, content } = parseChapter(html);
      
      results.set(chapterNum, { title, content, success: true });
      successCount++;
      console.log(`✓ 第${chapterNum}章: ${title} (${content.length}字)`);
      
      // 小延迟避免太快
      await delay(DELAY_MS);
    } catch (err) {
      results.set(chapterNum, { title: `第${chapterNum}章`, content: '', success: false, error: err.message });
      failCount++;
      console.log(`✗ 第${chapterNum}章失败: ${err.message}`);
    }
  });
  
  // 按顺序写入文件
  fs.writeFileSync(outputPath, `《晋末长剑》\n作者：孤独麦客\n${'='.repeat(60)}\n\n`, 'utf8');
  
  for (let i = START_CHAPTER; i <= END_CHAPTER; i++) {
    const result = results.get(i);
    if (result && result.success) {
      const chapterText = `\n${result.title}\n${'-'.repeat(50)}\n\n${result.content}\n\n`;
      fs.appendFileSync(outputPath, chapterText, 'utf8');
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========== 爬取完成 ==========`);
  console.log(`耗时: ${elapsed}秒`);
  console.log(`成功: ${successCount} 章`);
  console.log(`失败: ${failCount} 章`);
  console.log(`文件已保存到: ${outputPath}`);
}

main().catch(console.error);

