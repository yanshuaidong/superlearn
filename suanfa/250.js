/*
250. 统计同值子树
树
深度优先搜索
二叉树
给定一个二叉树，统计该二叉树数值相同的 子树 个数。

同值子树是指该子树的所有节点都拥有相同的数值。

 

示例 1：


输入：root = [5,1,5,5,5,null,5]
输出：4
示例 2：

输入：root = []
输出：0
示例 3：

输入：root = [5,5,5,5,5,null,5]
输出：6
 

提示：

树中节点的编号在 [0, 1000] 范围内
-1000 <= Node.val <= 1000


*/ 

/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var countUnivalSubtrees = function (root) {
    if (!root) return 0;

    let set = new Set();
    function dfsSet(node) {
        if (!node) return;
        set.add(node.val)
        dfsSet(node.left);
        dfsSet(node.right);
    }
    dfsSet(root)
    let ans = 0;
    set.forEach((item) => {
        let tempAns = 0;
        function dfs(node) {
            if (!node) return;

            dfs(node.left);
            dfs(node.right);

            let l = 1;

            // 情况1左右都有值，且相等，完美的树
            if (node.left && node.right) {
                if (node.val == item && node.val == node.left.val && node.val == node.right.val) {
                    // 需要+1
                    tempAns += 1;
                }
            }
            // 左相等
            if (node.left && !node.right && node.val == item && node.val == node.left.val) {
                // 需要+1
                tempAns += 1;
            }
            // 右相等
            if (node.right && !node.left && node.val == item && node.val == node.right.val) {
                // 需要+1
                tempAns += 1;
            }
            let aa = node.left;
            let bb = node.val;
            if (!node.left && !node.right && node.val == item) {
                // 需要+1
                tempAns += 1;
            }
            // 其他情况都不能加
        }
        dfs(root);
        ans = Math.max(ans, tempAns);
    })

    return ans;
};


