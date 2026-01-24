/*
723. 粉碎糖果
中等
这个问题是实现一个简单的消除算法。

给定一个 m x n 的二维整数数组 board 代表糖果所在的方格，不同的正整数 board[i][j] 代表不同种类的糖果，如果 board[i][j] == 0 代表 (i, j) 这个位置是空的。

给定的方格是玩家移动后的游戏状态，现在需要你根据以下规则粉碎糖果，使得整个方格处于稳定状态并最终输出：

如果有三个及以上水平或者垂直相连的同种糖果，同一时间将它们粉碎，即将这些位置变成空的。
在同时粉碎掉这些糖果之后，如果有一个空的位置上方还有糖果，那么上方的糖果就会下落直到碰到下方的糖果或者底部，这些糖果都是同时下落，也不会有新的糖果从顶部出现并落下来。
通过前两步的操作，可能又会出现可以粉碎的糖果，请继续重复前面的操作。
当不存在可以粉碎的糖果，也就是状态稳定之后，请输出最终的状态。
你需要模拟上述规则并使整个方格达到稳定状态，并输出。

 

示例 1 :

输入: board = [[110,5,112,113,114],[210,211,5,213,214],[310,311,3,313,314],[410,411,412,5,414],[5,1,512,3,3],[610,4,1,613,614],[710,1,2,713,714],[810,1,2,1,1],[1,1,2,2,2],[4,1,4,4,1014]]
输出: [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[110,0,0,0,114],[210,0,0,0,214],[310,0,0,113,314],[410,0,0,213,414],[610,211,112,313,614],[710,311,412,613,714],[810,411,512,713,1014]]
示例 2:

输入: board = [[1,3,5,5,2],[3,4,3,3,1],[3,2,4,5,2],[2,4,4,5,5],[1,4,4,1,1]]
输出: [[1,3,0,0,0],[3,4,0,5,2],[3,2,0,3,1],[2,4,0,5,2],[1,4,3,1,1]]

*/

/**
 * @param {number[][]} board
 * @return {number[][]}
 */
var candyCrush = function (board) {
  // 核心就是两件事情。
  // 1是找到要消除的糖果并标记。
  // 2让糖果下落补空。
  // 1 先找那些格子要消除
  // 规则是：横着连续 ≥3 个相同 或 竖着连续 ≥3 个相同。
  // 先标记后清楚
  let resBoard = board;
  let m = board.length; // 行数
  let n = board[0].length; // 列数
  let isOk = false;


  while (!isOk) {
    let toCrushEmpty = getToCrushEmpty(m, n); // true 就需要消除
    let toCrush = getToCrushRuned(m, n, resBoard, toCrushEmpty)
    // 如果toCrush全部是false 就说明ok了。
    isOk = isOkpand(m, n, toCrush);
    if (isOk) {
      return resBoard;
    }
    // 带0的
    let newBoard = biaoji(m, n, resBoard, toCrush);
    resBoard = xiagnxia(m, n, newBoard);
  }

  return resBoard;
};

// 向下移动函数
var xiagnxia = function (m, n, board) {
  // 竖着遍历 i是列 j是行
  for (let i = 0; i < n; i++) {
    // 先收集
    let arrNot0 = [];
    for (let j = 0; j < m; j++) {
      if (board[j][i] !== 0) {
        arrNot0.push(board[j][i]);
      }
    }

    // 再改变
    for (let k = m - 1; k > -1; k--) {
      if (arrNot0.length) {
        let last = arrNot0.pop();
        board[k][i] = last;
      } else {
        board[k][i] = 0;
      }
    }
  }
  return board;
}

// 返回一个 m 行 n 列的 false 的数组
var getToCrushEmpty = function (m, n) {
  let arr = [];
  for (let i = 0; i < m; i++) {
    arr.push(Array(n).fill(false));
  }
  // 语法是Array(数量).fill(用fill充满)
  // Array(n).fill(false)
  return arr;
}

var isOkpand = function (m, n, toCrush) {
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (toCrush[i][j]) {
        // 说明还需要消除 说明还没好
        return false;
      }
    }
  }
  return true;
}

var getToCrushRuned = function (m, n, board, toCrush) {
  // 1找出要消除的格子
  // 横着遍历
  for (let i = 0; i < m; i++) {
    let tempNum = -1;
    let tempShuliang = 0;
    for (let j = 0; j < n; j++) {
      let num = board[i][j];
      // 当前的数字等于之前的数字
      if (num === tempNum) {
        // 数量+1
        tempShuliang += 1;
      } else {
        // 说明是个新数字从1开始
        tempShuliang = 1;
      }
      // 如果之前有3个一样的了，开始标记并且数字不是0有数字
      if (tempShuliang >= 3 && num) {
        // 应该标记了
        // 1 1 1 标记当前和前两个就可以
        toCrush[i][j] = true;
        toCrush[i][j - 1] = true;
        toCrush[i][j - 2] = true;
      }
      // 把当前的给之前，向下走
      tempNum = num;
    }
  }

  // 竖着遍历（一样的）
  for (let i = 0; i < n; i++) {
    let tempNum = -1;
    let tempShuliang = 0;
    for (let j = 0; j < m; j++) {
      let num = board[j][i];
      // 当前的数字等于之前的数字
      if (num === tempNum) {
        // 数量+1
        tempShuliang += 1;
      } else {
        // 说明是个新数字从1开始
        tempShuliang = 1;
      }
      // 如果之前有3个一样的了，开始标记
      if (tempShuliang >= 3 && num) {
        // 应该标记了
        // 1 1 1 标记当前和前两个就可以
        toCrush[j][i] = true;
        toCrush[j - 1][i] = true;
        toCrush[j - 2][i] = true;
      }
      // 把当前的给之前，向下走
      tempNum = num;
    }
  }

  return toCrush;
}

// 标记为0 就是消除了
var biaoji = function (m, n, board, toCrush) {
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (toCrush[i][j]) {
        board[i][j] = 0;
      }
    }
  }
  return board;
}

let res = candyCrush([[110, 5, 112, 113, 114], [210, 211, 5, 213, 214], [310, 311, 3, 313, 314], [410, 411, 412, 5, 414], [5, 1, 512, 3, 3], [610, 4, 1, 613, 614], [710, 1, 2, 713, 714], [810, 1, 2, 1, 1], [1, 1, 2, 2, 2], [4, 1, 4, 4, 1014]]);
let a = 1;


