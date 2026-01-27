/*
用JavaScript。
下面题目要如何做呢？我不太理解了。请你简单告诉我思路，然后再给我一个简单的答案。


616. 给字符串添加加粗标签
类别：
区间集合

相关标签：
字典树
数组
哈希表
字符串
字符串匹配

给定字符串 s 和字符串数组 words。

对于 s 内部的子字符串，若其存在于 words 数组中， 则通过添加闭合的粗体标签 <b> 和 </b> 进行加粗标记。

如果两个这样的子字符串重叠，你应该仅使用一对闭合的粗体标签将它们包围起来。
如果被粗体标签包围的两个子字符串是连续的，你应该将它们合并。
返回添加加粗标签后的字符串 s 。

 

示例 1：

输入： s = "abcxyz123", words = ["abc","123"]
输出："<b>abc</b>xyz<b>123</b>"
解释：两个单词字符串是 s 的子字符串，如下所示: "abcxyz123"。
我们在每个子字符串之前添加<b>，在每个子字符串之后添加</b>。
示例 2：

输入：s = "aaabbb", words = ["aa","b"]
输出："<b>aaabbb</b>"
解释：
"aa"作为子字符串出现了两次: "aaabbb" 和 "aaabbb"。
"b"作为子字符串出现了三次: "aaabbb"、"aaabbb" 和 "aaabbb"。
我们在每个子字符串之前添加<b>，在每个子字符串之后添加</b>: "<b>a<b>a</b>a</b><b>b</b><b>b</b><b>b</b>"。
由于前两个<b>重叠，把它们合并得到: "<b>aaa</b><b>b</b><b>b</b><b>b</b>"。
由于现在这四个<b>是连续的，把它们合并得到: "<b>aaabbb</b>"。

*/

/**
 * @param {string} s
 * @param {string[]} words
 * @return {string}
 */
var addBoldTag = function (s, words) {
  // s = "abcxyz123", words = ["abc","123"]
  let n = s.length;
  let markArr = new Array(n).fill(false);
  //markArr  [false,false.....]
  for (let i = 0; i < s.length; i++) {
    // a
    let ch = s[i];
    for (let j = 0; j < words.length; j++) {
      // abc
      let word = words[j];
      // 没必要第一个字符串相等，直接判断是否全部相等就可以了
      // abcxyz123
      // 012 3
      if (s.slice(i, i + word.length) === word) {
        // 匹配成功

        // 标记
        // 0,1,2 要标记
        // 开始时i（包含），结束是i+size（3）
        // 开始0，结束2
        // markArr【0】【1】，【2】
        for (let k = i; k < i + word.length; k++) {
          markArr[k] = true;
        }
      }
    }
  }
  // 标记成功了
  // markArr
  let ans = '';
  // let left = 0;
  for (let i = 0; i < markArr.length; i++) {
    // 
    // [false,false.....]

    let mark = markArr[i];
    let lastMark = markArr[i-1];
    let nextMark = markArr[i+1];
    // abc 开头
    if(mark === true && (i === 0 || lastMark === false)){
      ans += "<b>";
    }
    ans += s[i];
    if(mark === true && (i === markArr.length-1 || markArr[i+1] === false)){
      ans += "</b>";
    }
  }
  let a = 1;
  return ans;
};

addBoldTag("abcdef", ["a","c","e","g"])

/*
有问题的代码：
  for (let right = 0; right < markArr.length; right++) {
    // 
    // [false,false.....]
    // 头，尾部，中
    // 双指针 里面都是ture的包起来。
    // abc xyz 123
    // 012 3

    let mark = markArr[right];
    // abc
    if(mark === true){
      trueLength++;
      // ans = ans + "<b>" + s.slice(left,right) + "</b>";
      // left = right;
    }
    // 3个true 3 
    if(mark === false && trueLength > 0){
      ans = ans + "<b>" + s.slice(right - trueLength,right) + "</b>";
      trueLength = 0;
    }
  }

*/ 