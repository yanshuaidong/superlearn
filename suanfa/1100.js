/*
1100. 长度为 K 的无重复字符子串

给你一个字符串 S，找出所有长度为 K 且不含重复字符的子串，请你返回全部满足要求的子串的 数目。

 

示例 1：

输入：S = "havefunonleetcode", K = 5
输出：6
解释：
这里有 6 个满足题意的子串，分别是：'havef','avefu','vefun','efuno','etcod','tcode'。
示例 2：

输入：S = "home", K = 5
输出：0
解释：
注意：K 可能会大于 S 的长度。在这种情况下，就无法找到任何长度为 K 的子串。


*/ 


/**
 * @param {string} s
 * @param {number} k
 * @return {number}
 */
var numKLenSubstrNoRepeats = function(s, k) {
    if(k > s.length) return 0;
    let res = 0; // 所有满足的数目
    let left = 0;
    let mapK = new Map();
    // havefunonleetcode 5
    // mapK (h a v e f)
    // 思路：滑动窗口
    for(let right = 0; right < s.length ; right++){
        let rightCh = s[right]; // h
        mapK.set(rightCh, (mapK.get(rightCh) || 0) + 1);
        // h 1
        // h a v e f u  6>5 或者已经有一样的字符串了。
        while(mapK.size > k || mapK.get(rightCh) >= 2){
            // 减少到k
            let leftCh = s[left];
            // h
            mapK.set(leftCh, mapK.get(leftCh) - 1 );

            if(mapK.get(leftCh)<=0){
                mapK.delete(leftCh);
            }
            left++;
        }
        //a v e f u
        if(mapK.size === k){
            let resStr = s.slice(left, right+1)
            res++;
        }
    }
    return res;
};

numKLenSubstrNoRepeats('havefunonleetcode', 5)