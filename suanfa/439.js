/*
439. 三元表达式解析器

给定一个表示任意嵌套三元表达式的字符串 expression ，求值并返回其结果。
你可以总是假设给定的表达式是有效的，并且只包含数字， '?' ，  ':' ，  'T' 和 'F' ，其中 'T' 为真， 'F' 为假。表达式中的所有数字都是 一位 数(即在 [0,9] 范围内)。
条件表达式从右到左分组(大多数语言中都是这样)，表达式的结果总是为数字，'T' 或 'F' 。


示例 1：

输入： expression = "T?2:3"
输出： "2"
解释： 如果条件为真，结果为 2；否则，结果为 3。
示例 2：

输入： expression = "F?1:T?4:5"
输出： "4"
解释： 条件表达式自右向左结合。使用括号的话，相当于：
 "(F ? 1 : (T ? 4 : 5))" --> "(F ? 1 : 4)" --> "4"
or "(F ? 1 : (T ? 4 : 5))" --> "(T ? 4 : 5)" --> "4"
示例 3：

输入： expression = "T?T?F:5:3"
输出： "F"
解释： 条件表达式自右向左结合。使用括号的话，相当于：
"(T ? (T ? F : 5) : 3)" --> "(T ? F : 3)" --> "F"
"(T ? (T ? F : 5) : 3)" --> "(T ? F : 5)" --> "F"
 

提示:

5 <= expression.length <= 104
expression 由数字, 'T', 'F', '?' 和 ':' 组成
保证 了表达式是一个有效的三元表达式，并且每个数字都是 一位数 

*/

/**
 * @param {string} expression
 * @return {string}
 */
var parseTernary = function (expression) {
  // 理解后
  // 从右向左找第一个问号然后再找最近的冒号。计算好了再
  let stack = [];
  let i = expression.length - 1;
  // 从后向前遍历 -1 会出去
  while (i >= 0) {
    // 如果遇到问号就出栈
    let str = expression[i];
    // "F?1: T?4:5"
    // 当前字符是T或F，并且栈顶元素是？
    if ((str === 'T' || str === 'F') && stack[stack.length - 1] === '?') {
      // 把T?4:5 变成 4
      stack.push(str)
      jisuan(stack)
    }else{
      stack.push(str)
    }
    i--;
  }
  return stack[0];
};

function jisuan(stack) {
  // T?4:5 一定会是这样的结构, 例如 ['5', ':', '4', '?', 'T']
  if (stack[stack.length - 1] === 'T') {
    // 取真分支，也就是 ? 后面那个
    let ans = stack[stack.length - 3];
    // 删除 5 个元素，使用 splice 方法
    stack.splice(stack.length - 5, 5);
    // 添加结果
    stack.push(ans);
  } else if (stack[stack.length - 1] === 'F') {
    // 取假分支，也就是 : 后面那个
    let ans = stack[stack.length - 5];
    // 删除 5 个元素，使用 splice 方法
    stack.splice(stack.length - 5, 5);
    // 添加结果
    stack.push(ans);
  }
}
parseTernary("F?1:T?4:5")

