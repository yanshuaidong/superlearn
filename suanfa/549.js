/*
549. 二叉树最长连续序列 II

相关标签
树
深度优先搜索
二叉树

给定二叉树的根 root ，返回树中最长连续路径的长度。
连续路径是路径中相邻节点的值相差 1 的路径。此路径可以是增加或减少。

例如， [1,2,3,4] 和 [4,3,2,1] 都被认为有效，但路径 [1,2,4,3] 无效。
另一方面，路径可以是子-父-子顺序，不一定是父子顺序。

 

示例 1:



输入: root = [1,2,3]
输出: 2
解释: 最长的连续路径是 [1, 2] 或者 [2, 1]。
 

示例 2:



输入: root = [2,1,3]
输出: 3
解释: 最长的连续路径是 [1, 2, 3] 或者 [3, 2, 1]。
 

提示：

树上所有节点的值都在 [1, 3 * 104] 范围内。
-3 * 104 <= Node.val <= 3 * 104


*/ 

var longestConsecutive = function (root) {
    if (!root) return 0;

    function dfs(node) {
        if (!node) return { inc: 0, dec: 0 };

        let L = dfs(node.left);
        let R = dfs(node.right);
        // 当前节点至少可以自己形成长度为1的链
        let inc = 1; // 递增（+1）链
        let dec = 1; // 递减（+1）链

        // 尝试用左孩子节点来延长当前 inc或dec
        // 6) 尝试用左孩子来延长当前 inc/dec
        if (node.left) {
            // 如果 left = node + 1，那么 node->left 是递增方向
            // 当前 inc 可以接上左孩子的 inc
            if (node.left.val === node.val + 1) {
                inc = Math.max(inc, L.inc + 1);
            }
            // 如果 left = node - 1，那么 node->left 是递减方向
            // 当前 dec 可以接上左孩子的 dec
            if (node.left.val === node.val - 1) {
                dec = Math.max(dec, L.dec + 1);
            }
        }

        // 7) 尝试用右孩子来延长当前 inc/dec（同理）
        if (node.right) {
            if (node.right.val === node.val + 1) {
                inc = Math.max(inc, R.inc + 1);
            }
            if (node.right.val === node.val - 1) {
                dec = Math.max(dec, R.dec + 1);
            }
        }
        // 8) 关键：以 node 作为“拐点”拼接
        // 一条连续路径可以是：先递减到 node，再递增离开 node（或反过来）
        // dec 和 inc 都包含 node 本身，所以拼接时要 -1 去重
        ans = Math.max(ans, inc + dec - 1);
        // 9) 把当前节点的 (inc, dec) 返回给父节点使用
        return { inc, dec };
    }
    let ans = 1;
    dfs(root);
    return ans;
};