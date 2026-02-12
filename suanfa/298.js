/*
298. 二叉树最长连续序列

相关标签
树
深度优先搜索
二叉树

给你一棵指定的二叉树的根节点 root ，请你计算其中 最长连续序列路径 的长度。

最长连续序列路径 是依次递增 1 的路径。该路径，可以是从某个初始节点到树中任意节点，通过「父 - 子」关系连接而产生的任意路径。且必须从父节点到子节点，反过来是不可以的。

 
示例 1：


输入：root = [1,null,3,2,4,null,null,null,5]
输出：3
解释：当中，最长连续序列是 3-4-5 ，所以返回结果为 3 。
示例 2：


输入：root = [2,null,3,2,null,1]
输出：2
解释：当中，最长连续序列是 2-3 。注意，不是 3-2-1，所以返回 2 。
 

提示：

树中节点的数目在范围 [1, 3 * 104] 内
-3 * 104 <= Node.val <= 3 * 104


*/ 


/*
要求二叉树最长连续序列

*/ 
var longestConsecutive = function (root) {
    function dfs(node, parentVal,parentLen){
        if(!node) return;
        let curLen = 0;
        if(node.val === (parentVal + 1)){
            curLen = parentLen + 1;
        }else{
            curLen = 1;
        }
        ans = Math.max(ans, curLen);
        dfs(node.left, node.val,curLen);
        dfs(node.right, node.val,curLen);
    }
    let ans = 0;
    dfs(root, root.val, 0);
    return ans;
};

/*
1）树上FSD（深度优先遍历）的核心范式，把状态沿着边向下传递
这个题目路径只允许 父 到 子 ，所以最自然的是：
在递归参数里携带 到父节点为止的状态，这里是父节点的值，和父节点为止的长度。
到当前节点用一个局部变量形成新的curLen
再把curLen传递给左右子树
我学到的是一类通用的套路。
如果只需要从上到下的信息，就用参数传递的，深度优先遍历。
2）局部最优+全局最优
curLen代表，以当前节点为结尾的最优值。局部。
ans 代表全局扫描到目前为止最优的值。
这是一个常见的结构。
3）连续条件断开的时候要重置，而不是硬拼。
条件node。val == parent。val +1成立才延续，否则
直接curLen = 1；从自己重新开始
这体现了树路径题常见的断链重启思想。
4）递归函数的设计，参数含义要语义化。
递归契约。
dfs（node，parentVal，parentLen）的含义最好能一句话讲清楚。
走到node的时候，父节点的值是parentVal，node是当前节点，且以父节点结尾的连续链长是parentLen。
5）闭包和作用域的问题。
后面我理解了。
6）边界意识：根节点和空树。
我们用了dfs（root，root。val-1,0）来让根节点自然得到curLen=1.这是一种哨兵初始化的技巧。
*/ 



