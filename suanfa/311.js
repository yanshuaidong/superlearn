/*
311. 稀疏矩阵的乘法

给定两个 稀疏矩阵 ：大小为 m x k 的稀疏矩阵 mat1 和大小为 k x n 的稀疏矩阵 mat2 ，返回 mat1 x mat2 的结果。你可以假设乘法总是可能的。

 

示例 1：



输入：mat1 = [[1,0,0],[-1,0,3]], mat2 = [[7,0,0],[0,0,0],[0,0,1]]
输出：[[7,0,0],[-7,0,3]]
 示例 2:

输入：mat1 = [[0]], mat2 = [[0]]
输出：[[0]]

*/

/**
 * @param {number[][]} mat1
 * @param {number[][]} mat2
 * @return {number[][]}
 */
var multiply = function (mat1, mat2) {
  // 我感觉在考矩阵乘法是如何计算的
  // 新建一个空的 m*n 的数组，也可以这样写：
  let res = [];
  let m = mat1.length;
  let k = mat1[0].length;

  // let k = mat2.length;
  let n = mat2[0].length;
  // 前行 乘后列 对应元素相乘再相加
  //     输入：mat1 = [[1,0,0],[-1,0,3]], mat2 = [[7,0,0],[0,0,0],[0,0,1]]
  // 输出：[[7,0,0],[-7,0,3]]
  // 例子： 1*7 + 0*0 + 0*0 = 7 

  let map1 = new Map();

  let map2 = new Map();

  // m k
  for (let i = 0; i < m; i++) {
    // map1 结构
    // 行号（1） -> [1,0,0]
    // 行号（2） -> [-1,0,3]
    map1.set(i, mat1[i])
  }

  // k x n
  for (let i = 0; i < n; i++) {
    let arr = [];
    for (let j = 0; j < k; j++) {
      let num = mat2[j][i];
      arr.push(num)
    }
    // map2 结构
    // 列号（1） -> [7,0,0]
    // 列号（2） -> [0,0,0]
    // 列号（3） -> [0,0,1]
    map2.set(i,arr)
  }

  // 结果是 m n的数组。
  for (let i = 0; i < m; i++) {
    res.push([])
    for (let j = 0; j < n; j++) {
      res[i][j] = cheng(map1.get(i), map2.get(j))
    }
  }
  return res;
};

var cheng = function (arr1, arr2) {
  // 对应元素相乘再相加
  // 1*7 + 0*0 + 0*0 = 7 
  let res = 0;
  for (let i = 0; i < arr1.length; i++) {
    const element = arr1[i];
    res += (arr1[i] * arr2[i]);
  }
  return res;
}