/**
结论：把 N 从右往左逐位“旋转映射”并拼成新数 rotated；过程中只要遇到 2/3/4/5/7 这类无效数字直接返回 false；最终比较 rotated !== N，不相等则是易混淆数。

核心思路（为什么要从右往左）

旋转 180° 后，原来的最低位会变成新数的最高位。
所以我们处理数字时，应该不断取 N % 10（拿到最低位），映射成旋转后的数字，再用 rotated = rotated * 10 + mappedDigit 依次拼起来。

可旋转映射如下：

0 → 0

1 → 1

6 → 9

8 → 8

9 → 6

2/3/4/5/7：无效（旋转后不是数字）

过程举例
N = 89

取 9 → 映射 6，rotated = 6

取 8 → 映射 8，rotated = 68
最终 rotated = 68，且 68 ≠ 89，所以 true

N = 11

1 → 1，rotated = 1

1 → 1，rotated = 11
rotated = 11 等于原数，所以 false

N = 25

5 无效，直接 false
function confusingNumber(N) {
  const map = {
    0: 0,
    1: 1,
    6: 9,
    8: 8,
    9: 6,
  };

  let x = N;
  let rotated = 0;

  while (x > 0) {
    const digit = x % 10;
    if (map[digit] === undefined) return false; // 无效数字
    rotated = rotated * 10 + map[digit];
    x = Math.floor(x / 10);
  }

  return rotated !== N;
}

复杂度

时间：O(k)，k 是数字位数（最多 10 位左右）

空间：O(1)

如果你还想要扩展版（例如 LeetCode 1088：统计 1..N 的易混淆数，需要 DFS/回溯），我也可以直接给你完整解法。
 * */ 


/**
 * 判断一个数字是否是"易混淆数"
 * 
 * 易混淆数定义：将数字旋转180°后，得到一个不同的有效数字
 * 
 * 算法思路：
 * 1. 从右往左逐位取出数字（因为旋转180°后，原来的最低位变成最高位）
 * 2. 将每一位数字映射成旋转后的对应数字
 * 3. 拼接成新的数字 rotatedNumber
 * 4. 如果遇到无法旋转的数字（2/3/4/5/7），直接返回 false
 * 5. 最终比较 rotatedNumber 是否与原数不同
 * 
 * @param {number} n - 待判断的非负整数
 * @returns {boolean} - 如果是易混淆数返回 true，否则返回 false
 */
function confusingNumber(n){
  // 定义数字旋转180°后的映射关系
  // 0旋转后还是0，1还是1，6变9，8还是8，9变6
  // 注意：2/3/4/5/7 旋转后不是有效数字，所以不在映射表中
  const rotateMap = {
    0:0,
    1:1,
    6:9,
    8:8,
    9:6,
  }
  
  let remaining = n;       // 剩余待处理的数字（会被不断除以10）
  let rotatedNumber = 0;   // 旋转后的结果数字
  
  // 从右往左逐位处理数字
  while(remaining > 0){
    // 取出当前最低位数字（个位）
    const currentDigit = remaining % 10;
    
    // 查找当前数字旋转后的对应值
    const rotatedDigit = rotateMap[currentDigit];
    
    // 如果这个数字无法旋转（不在映射表中），说明不是易混淆数
    const isInvalidDigit = (rotatedDigit === undefined);
    if(isInvalidDigit) return false;
    
    // 将已有结果左移一位（乘以10），为新数字腾出个位
    const shiftedResult = rotatedNumber * 10;
    
    // 将旋转后的数字放到个位，拼接成新的结果
    // 例如：shiftedResult=60, rotatedDigit=8 → rotatedNumber=68
    rotatedNumber = shiftedResult + rotatedDigit;
    
    // 去掉已处理的最低位，继续处理下一位
    remaining = Math.floor(remaining / 10);
  }
  
  // 旋转后的数字与原数字不同，才是"易混淆数"
  const isDifferentAfterRotation = (rotatedNumber !== n);
  // 例如：89 旋转后是 68，68≠89，所以是易混淆数
  // 例如：11 旋转后是 11，11=11，所以不是易混淆数
  return isDifferentAfterRotation;
};

