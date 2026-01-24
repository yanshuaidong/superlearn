/*

1198. 找出所有行中最小公共元素

给你一个 m x n 的矩阵 mat，其中每一行的元素均符合 严格递增 。请返回 所有行中的 最小公共元素 。

如果矩阵中没有这样的公共元素，就请返回 -1。

 

示例 1：

输入：mat = [[1,2,3,4,5],[2,4,5,8,10],[3,5,7,9,11],[1,3,5,7,9]]
输出：5
示例 2:

输入：mat = [[1,2,3],[2,3,4],[2,3,5]]
输出： 2

*/


/**
 * @param {number[][]} mat
 * @return {number}
 */
var smallestCommonElement = function (mat) {
  let matSetArr = [];
  // 倒着找试试。
  let min = -1;
  for (let i = 0; i < mat.length; i++) {
    let arr = mat[i];
    let set = new Set();
    // a d c
    for (let j = 0; j < arr.length; j++) {
      let num = arr[j];
      set.add(num)
    }
    matSetArr.push(set)
  }

  for (let i = 0; i < mat[0].length; i++) {
    let mat0num = mat[0][i];
    let numci = 0;
    for (let j = 0; j < matSetArr.length; j++) {
      let matSet = matSetArr[j];
      if(matSet.has(mat0num)){
        numci +=1;
      }
      if(numci === mat.length){
        return mat0num;
      }
    }
  }

  return min;
};