/*

760. 找出变位映射
给你两个整数数组 nums1 和 nums2，其中 nums2 是 nums1 的一个 变位词 。两个数组都可能包含重复元素。

返回一个下标映射数组 mapping，它将 nums1 映射到 nums2，其中 mapping[i] = j 表示 nums1 中的第 i 个元素出现在 nums2 的第 j 个下标上。如果有多个答案，返回 任意一个 。

数组 a 是数组 b 的一个 变位词 意味着 b 是通过将 a 中元素的顺序随机打乱生成的。

 

示例 1：

输入：nums1 = [12,28,46,32,50], nums2 = [50,12,32,46,28]
输出：[1,4,3,2,0]
解释：因为 nums1 中的第 0 个元素出现在 nums2[1] 上，所以 mapping[0] = 1，而 nums1 中的第 1 个元素出现在 nums2[4] 上，所以 mapping[1] = 4，以此类推。
示例 2：

输入：nums1 = [84,46], nums2 = [84,46]
输出：[0,1]



相关api

结论：是的，你总结完全正确。下面这张表把四个 API 一次性对齐。

| API          | 操作位置 | 作用       | 返回值   | 例子（对 `[10,20,30]`）                     |
| ------------ | ---- | -------- | ----- | -------------------------------------- |
| `shift()`    | 头部   | 删除 1 个元素 | 被删的元素 | 返回 `10`，数组变 `[20,30]`                  |
| `unshift(x)` | 头部   | 插入元素 `x` | 新长度   | `unshift(5)` 返回 `4`，数组变 `[5,10,20,30]` |
| `pop()`      | 尾部   | 删除 1 个元素 | 被删的元素 | 返回 `30`，数组变 `[10,20]`                  |
| `push(x)`    | 尾部   | 插入元素 `x` | 新长度   | `push(40)` 返回 `4`，数组变 `[10,20,30,40]`  |


*/ 

/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number[]}
 */
var anagramMappings = function(nums1, nums2) {
    let pos = new Map();
    for(let j = 0; j < nums2.length; j++){
      let nums2ch = nums2[j];
      // 如果没有
      if(pos.has(nums2ch) === false ){
        // 设置一个数组
        pos.set(nums2ch,[])
      }
      let arr = pos.get(nums2ch);
      arr.push(j);
    }
    let mapping = new Array(nums1.length); // 下标映射数组
    for(let i = 0; i < nums1.length; i++){
      let nums1ch = nums1[i];
      // 如果里面有（肯定会有的）
      if(pos.has(nums1ch) === true){
        let temparr = pos.get(nums1ch);
        let first = temparr.shift(); // 删除第一个，并取出
        mapping[i] = first;
      }
    }
    return mapping;
};