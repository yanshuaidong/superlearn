/*

531. 孤独像素 I

给你一个大小为 m x n 的图像 picture ，图像由黑白像素组成，'B' 表示黑色像素，'W' 表示白色像素，请你统计并返回图像中 黑色 孤独像素的数量。

黑色孤独像素 的定义为：如果黑色像素 'B' 所在的同一行和同一列不存在其他黑色像素，那么这个黑色像素就是黑色孤独像素。

 

示例 1：


输入：picture = [["W","W","B"],["W","B","W"],["B","W","W"]]
输出：3
解释：全部三个 'B' 都是黑色的孤独像素
示例 2：


输入：picture = [["B","B","B"],["B","B","W"],["B","B","B"]]
输出：0

*/


/*
531. 孤独像素 I

给你一个大小为 m x n 的图像 picture（是举行，不是正方形） ，图像由黑白像素组成，'B' 表示黑色像素，'W' 表示白色像素，请你统计并返回图像中 黑色 B 孤独像素的数量。

黑色孤独像素 的定义为：如果黑色像素 'B' 所在的同一行和同一列不存在其他黑色像素，那么这个黑色像素就是黑色孤独像素。
翻译一下：

picture[i][j] 
i行
j列
不存在其他黑色像素

最多有min（m,n）个
33 的最多有3个
12 的最多有1个

行方向的数量 列方向的数量取最小的应该就行（感觉）

示例 1：


输入：picture = [["W","W","B"],["W","B","W"],["B","W","W"]]
输出：3
解释：全部三个 'B' 都是黑色的孤独像素
示例 2：


输入：picture = [["B","B","B"],["B","B","W"],["B","B","B"]]
输出：0


*/


/**
 * @param {character[][]} picture
 * @return {number}
 */
var findLonelyPixel = function (picture) {
  let num = 0; // 黑色 "B" 孤独像素的数量

  let m = picture.length; // 行数
  let n = picture[0].length; // 列数

  let map = new Map();
  // 1hang -》 黑色数量
  // 2hang 
  // 1lie -》黑色数量
  // 2lie -》 黑色数量

  // 横着遍历
  for (let i = 0; i < m; i++) {
    let numB = 0;
    for (let j = 0; j < n; j++) {
      let color = picture[i][j];
      if (color === "B") {
        numB += 1;
      }
    }
    map.set(i+'hang', numB)
  }

  // 竖着遍历
  for (let i = 0; i < n; i++) {
    let numB = 0;
    for (let j = 0; j < m; j++) {
      let color = picture[j][i];
      if (color === "B") {
        numB += 1;
      }
    }
    map.set(i+'lie', numB)
  }

  // map组装完成

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let color = picture[i][j];
      // 再扫一遍矩阵：某个位置是 B 且它所在行黑色数=1、所在列黑色数=1，那么它就是“孤独像素”。
      if (color === "B" && map.get(i+'hang') === 1 && map.get(j+'lie') === 1) {
        num += 1;
      }
    }
  }
  return num;
};

/*
[["W","B","W","W"],
["W","B","B","W"]
,["W","W","W","W"]]


*/ 