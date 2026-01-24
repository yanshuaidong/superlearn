/*
1426. 数元素

给你一个整数数组 arr， 对于元素 x ，只有当 x + 1 也在数组 arr 里时，才能记为 1 个数。

如果数组 arr 里有重复的数，每个重复的数单独计算。

 

示例 1：

输入：arr = [1,2,3]
输出：2
解释：1 和 2 被计算次数因为 2 和 3 在数组 arr 里。
示例 2：

输入：arr = [1,1,3,3,5,5,7,7]
输出：0
解释：所有的数都不算, 因为数组里没有 2、4、6、8


*/ 


/**
 * @param {number[]} arr
 * @return {number}
 */
var countElements = function(arr) {
    let res = 0;

    let map = new Map();
    for(let i=0;i<arr.length;i++){
      let num = arr[i];
      map.set(num, num + 1);
    }
    for(let i = 0;i<arr.length;i++){
      let num = arr[i];
      if(map.has((num+1))){
        res+=1;
      }
    }
    return res;
};
