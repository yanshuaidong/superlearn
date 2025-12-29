/**
 * 题目描述：
 * 给定 m 个数组，每个数组都已经按照升序排好序了。
 * 现在你需要从两个不同的数组中选择两个整数（每个数组选一个）并且计算它们的距离。
 * 两个整数 a 和 b 之间的距离定义为它们差的绝对值 |a-b| 。
 * 返回最大距离。
 * 
 * 示例 1：
 * 输入：[[1,2,3],[4,5],[1,2,3]]
 * 输出：4
 * 解释：从第一个数组或者第三个数组中选择 1，同时从第二个数组中选择 5，距离为 |1-5| = 4
 * 
 * 示例 2：
 * 输入：arrays = [[1],[1]]
 * 输出：0
 * 
 * 算法思路：
 * 1. 由于每个数组都是升序排列，所以每个数组的最小值在首位，最大值在末位
 * 2. 要获得最大距离，我们需要用一个数组的最大值减去另一个数组的最小值（或反过来）
 * 3. 关键点：两个数必须来自不同的数组！
 * 4. 我们维护遍历过的数组中的全局最小值 minVal 和全局最大值 maxVal
 * 5. 对于当前数组，计算：
 *    - 当前数组最大值 与 之前所有数组的最小值 的差
 *    - 当前数组最小值 与 之前所有数组的最大值 的差
 * 6. 这样保证了参与计算的两个值一定来自不同数组
 * 
 * 时间复杂度：O(m)，其中 m 是数组的个数
 * 空间复杂度：O(1)，只使用常数级别的额外空间
 */
let maxDistance = function(arrays){
  // n min max
  let n = arrays[0].length;
  let min = arrays[0][0];
  let max = arrays[0][n-1];
  let res = 0;
  for(let i = 1; i<arrays.length;i++){
    n = arrays[i].length;
    // 
    res = Math.max(res,Math.max(Math.abs(arrays[i][n-1]-min),Math.abs(max-arrays[i][0])));
    min = Math.min(arrays[i][0],min)
    max = Math.max( arrays[i][n-1],max)

  }
return res;
}

// let test1 = [[1,2,3],[4,5],[1,2,3]];
let test2 = [[1,100],[2,3]];

let res = maxDistance(test2)

console.log(res);




