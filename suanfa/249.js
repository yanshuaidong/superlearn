/*

249. 移位字符串分组
对字符串进行 “移位” 的操作：

右移：将字符串中每个字母都变为其在字母表中 后续 的字母，其中用 'a' 替换 'z'。比如，"abc" 能够右移为 "bcd"，"xyz" 能够右移为 "yza"。
左移：将字符串中每个字母都变为其在字母表中 之前 的字母，其中用 'z' 替换 'a'。比如，"bcd" 能够左移为 "abc"，"yza" 能够左移为 "xyz"。
我们可以不断地向两个方向移动字符串，形成 无限的移位序列。

例如，移动 "abc" 来形成序列：... <-> "abc" <-> "bcd" <-> ... <-> "xyz" <-> "yza" <-> ... <-> "zab" <-> "abc" <-> ...
给定一个字符串数组 strings，将属于相同移位序列的所有 strings[i] 进行分组。你可以以 任意顺序 返回答案。

 

示例 1：

输入：strings = ["abc","bcd","acef","xyz","az","ba","a","z"]

输出：[["acef"],["a","z"],["abc","bcd","xyz"],["az","ba"]]

 

示例 2：

输入：strings = ["a"]

输出：[["a"]]

 

提示：

1 <= strings.length <= 200
1 <= strings[i].length <= 50
strings[i] 只包含小写英文字母。


*/

/**
 * @param {string[]} strings
 * @return {string[][]}
 */
var groupStrings = function (strings) {
  if (strings.length === 0) return [];
  let res = [];

  // 构建字母到编号的mapstr，比如 a->0, b->1, ..., z->25
  let mapstr = new Map();
  for (let i = 0; i < 26; i++) {
    mapstr.set(String.fromCharCode(97 + i), i);
  }
  // 结果 mapstr a->0, b->1, ..., z->25
  let map = new Map();
  for (let i = 0; i < strings.length; i++) {
    let str = strings[i];
    let start = 0;
    // 如果已经有了就跳过
    if(map.has(str)) continue;
    for (let j = 1; j < str.length; j++) {
      let leftch = str[start];
      let rightch = str[j];
      // 这里有个问题，直接用字符相减会得到NaN，应该转成mapstr映射的数字，不过这里只是注释原代码
      // ( rightch - leftch + 26) % 26; 
      let cha = ((mapstr.get(rightch) - mapstr.get(leftch) + 26) % 26) + ','; // 变成字符串
      map.set(str, (map.get(str) || '') + cha);
      start++;
    }
  }
  // map abc -> 00 def -> 01
  // 相同val的是会是同一个数组的。

  let mapRes = new Map();

  //00 -> [abc, def]

  for(let i= 0; i<strings.length;i++){
    let str = strings[i];
    let strcha = map.get(str); // 00
    let arr = mapRes.get(strcha) || [];
    arr.push(str);
    mapRes.set(strcha, arr);
  }



  for (let [key, val] of mapRes) {
    res.push(val);
  }

  return res;
};
