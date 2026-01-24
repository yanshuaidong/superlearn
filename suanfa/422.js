/*
422. 有效的单词方块

给你一个字符串数组 words，如果它能形成一个有效的 单词方块 ，则返回 true 。

有效的单词方块是指此由字符串数组组成的文字方块的 第 k 行 和 第 k 列所显示的字符串完全相同，其中 0 <= k < max(numRows, numColumns) 。

 

示例 1：


输入: words = ["abcd","bnrt","crmy","dtye"]
输出: true
解释:
第 1 行和第 1 列都读作 "abcd"。
第 2 行和第 2 列都读作 "bnrt"。
第 3 行和第 3 列都读作 "crmy"。
第 4 行和第 4 列都读作 "dtye"。
因此，它构成了一个有效的单词方块。
示例 2：


输入: words = ["abcd","bnrt","crm","dt"]
输出: true
解释:
第 1 行和第 1 列都读作 "abcd"。
第 2 行和第 2 列都读作 "bnrt"。
第 3 行和第 3 列都读作 "crm"。
第 4 行和第 4 列都读作 "dt"。
因此，它构成了一个有效的单词方块。
示例 3：


输入: words = ["ball","area","read","lady"]
输出: false
解释:
第 3 行读作 "read" 而第 3 列读作 "lead"。
因此，它不构成一个有效的单词方块。


*/


/**
 * @param {string[]} words
 * @return {boolean}
 */
var validWordSquare = function (words) {
  let res = true;
  for (let i = 0; i < words.length; i++) {
    for (let j = 0; j < words[i].length; j++) {
      // [i][j] 肯定是有的
      // 现在要判断 [j][i] 有没有
      // 镜子位置是 (j, i)，先“取一下”
      let row = words[j] || '';     // 第 j 行，不存在就当空串
      let ch = row[i] || '';       // 

      // 镜子位置没字符 => 直接 false
      if (ch === '') return false;

      // 对角线位置元素比较，如果不一样就返回false
      if (words[i][j] !== words[j][i]) return false;
    }
  }
  return res;
};


