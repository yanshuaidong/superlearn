/*
1272. 删除区间

实数集合(是个集合)可以表示为若干不相交区间的并集，其中每个区间的形式为 [a, b)（左闭右开），表示满足 a <= x < b 的所有实数  x 的集合。如果某个区间 [a, b) 中包含实数 x ，则称实数 x 在集合中。

给你一个 有序的 不相交区间列表 intervals 。intervals 表示一个实数集合，其中每一项 intervals[i] = [ai, bi] 都表示一个区间 [ai, bi) 。再给你一个要删除的区间 toBeRemoved 。

返回 一组实数，该实数表示intervals 中 删除 了 toBeRemoved 的部分 。换句话说，返回实数集合，并满足集合中的每个实数 x 都在 intervals 中，但不在 toBeRemoved 中。你的答案应该是一个如上所述的 有序的 不相连的间隔列表 。

示例 1：


输入：intervals = [[0,2],[3,4],[5,7]], toBeRemoved = [1,6]
输出：[[0,1],[6,7]]
示例 2：


输入：intervals = [[0,5]], toBeRemoved = [2,3]
输出：[[0,2],[3,5]]
示例 3：

输入：intervals = [[-5,-4],[-3,-2],[1,2],[3,5],[8,9]], toBeRemoved = [-1,4]
输出：[[-5,-4],[-3,-2],[4,5],[8,9]]

*/


/**
 * @param {number[][]} intervals
 * @param {number[]} toBeRemoved
 * @return {number[][]}
 */
var removeInterval = function (intervals, toBeRemoved) {
  // 左边界
  let left = toBeRemoved[0];
  // 右边界
  let right = toBeRemoved[1];
  let ans = [];
  // 用一个标记数组；
  // 先删除一些简单的。因为toBeRemoved只有一个所以
  for (let i = 0; i < intervals.length; i++) {
    let temp = intervals[i];

    // 分两种情况 1完全不想交 2有交集
    // 1完全不相交  [1  3]（完全不相交）   [5 9]   [12 99]（完全不相交）
    // 完全左或 完全右边
    if ((temp[0] <= left && temp[1] <= left) || (temp[0] >= right && temp[1] >= right)) {
      // 把temp添加到ans
      ans.push(temp)
    }


    // temp 右侧 和 toBeRemoved左侧 [1 5](temp)   [3 6](toBeRemoved)
    if (temp[0] < left && temp[1] > left && temp[0] < right && temp[1] < right) {
      ans.push([temp[0], left])
    }

    // temp 左侧 和 toBeRemoved右侧 [1 9](toBeRemoved) [5 20](temp)
    if (temp[0] > left && temp[1] > left && temp[0] < right && temp[1] > right) {
      ans.push([right, temp[1]])
    }

    // temp 被切成2段
    // temp 0 5  toBeRemoved 2 3
    if (temp[0] <= left && temp[1] >= left && temp[0] <= right && temp[1] >= right) {
      if (temp[0] !== left) ans.push([temp[0], left])
      if (right !== temp[1]) ans.push([right, temp[1]])
    }
  }
  let a = 1;
  return ans;
};

removeInterval([[0, 2], [3, 4], [5, 7]], [1, 6])