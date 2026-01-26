/*

==========================题目
253. 会议室 II

给你一个会议时间安排的数组 intervals ，每个会议时间都会包括开始和结束的时间 intervals[i] = [starti, endi] ，返回 所需会议室的最小数量 。

 

示例 1：

输入：intervals = [[0,30],[5,10],[15,20]]
输出：2
示例 2：

输入：intervals = [[7,10],[2,4]]
输出：1


*/ 



/*

==========================第一次弄错的点

### A. `minHeap.size` 用错了

你写的是方法 `size()`，但在主逻辑里用了 `minHeap.size > 0`。应改为 `minHeap.size() > 0`。

### B. `_siftUp/_siftDown` 里写了 `data[...]`，少了 `this.`

例如：

```js
if(data[p] <= data[i]) break;
```

这里 `data` 未定义，会直接 `ReferenceError`。应该是 `this.data[p]`。

### C. `pop()` 在堆只有 1 个元素时会出问题

你写：

```js
this.data[0] = this.data.pop();
this._siftDown(0);
```

当长度为 1 时，`pop()` 后数组空了，再给 `this.data[0]` 赋值会把 `undefined` 放回去，且 `_siftDown` 也没意义。需要特殊处理。

### D. `_siftDown` 里比较逻辑也有问题

你写的是用 `data[i]` 来比，但 `smallest` 更新后仍然用 `data[i]` 比较，会漏掉“右孩子比左孩子更小”的情况。标准写法是始终与 `this.data[smallest]` 比。


*/ 

class MinHeap {
  constructor() {
    this.data = [];
  }

  size() {
    return this.data.length;
  }

  peek() {
    return this.data.length === 0 ? null : this.data[0];
  }

  push(x) {
    this.data.push(x);
    this._siftUp(this.data.length - 1);
  }

  _siftUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.data[p] <= this.data[i]) break;
      this._swap(p, i);
      i = p;
    }
  }

  pop() {
    const n = this.data.length;
    if (n === 0) return null;
    if (n === 1) return this.data.pop();

    const min = this.data[0];
    this.data[0] = this.data.pop(); // 把最后一个放到堆顶
    this._siftDown(0);
    return min;
  }

  _siftDown(i) {
    const n = this.data.length;
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;

      if (l < n && this.data[l] < this.data[smallest]) smallest = l;
      if (r < n && this.data[r] < this.data[smallest]) smallest = r;

      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }


  _swap(i, j) {
    const tmp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = tmp;
  }
}
// 小根堆（Min-Heap）实现：用数组表示“完全二叉树”
// 约定：this.data[0] 永远是堆顶（最小值）
// 堆序性质：任意节点的值 <= 它的左右子节点的值
class MinHeap2 {
  constructor(){
    // 用数组存储堆：下标天然对应完全二叉树的层序位置
    // i 的左子：2*i+1；右子：2*i+2；父：Math.floor((i-1)/2)
    this.data = [];
  }
  // 返回堆中元素个数（节点数）
  size(){
    return this.data.length;
  }
  // 查看堆顶（最小值），不删除
  // 空堆返回 null
  peek(){
    return this.data.length === 0 ? null : this.data[0];
  }
  // 插入一个值 x （x是“值” ， 不是下标）
  push(x){
    // 1 ） 先把新元素放到数组末尾
    this.data.push(x);
    // 2) 新元素可能破坏 父 小于等于 子 的堆排序性质
    // 所以从他所在的位置开始，向上冒泡 siftup
    // 新元素刚插入的位置下标就是 length - 1；
    this_siftUp(this.data.length - 1);
  }
  _siftUp(i){
    // i 大于 0 表示当前节点不是堆顶
    // 因为i === 0 的时候已经没有父节点了，无法继续向上了
    while(i>0){
      // p 是 i 的父节点的下标
      let p  = Math.floor((i-1)/2);
      // 如果父节点小于等于当前节点，说明这条父子关系已经正确
      // 因为我们只是在从下往上修复这一条路径
      // 一旦这层满足堆排序，就可以停止 也就是break
      if(this.data[p] <= this.data[i]) break;

      // 否则 父节点更大 ，违反性质，需要交换
      // 交换后；更小的值上移，更大的值下移
      this._swap(p,i);
      // 交换后，新元素已经移动了到父节点的位置 p
      // 继续向上检查 它 与新的父节点的关系；
      i = p;
    }
  }
  // 交换位置
  _swap(i,j){
    let temp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = temp;
  }
  // 删除并返回堆顶部的元素，最小值
  pop(){
    let n = this.data.length; // 长度
    // 情况1 空堆 无元素可以删除返回null
    if( n === 0) return null;
    // 情况2 只有一个元素，直接弹出就可以
    if(n === 1 ) return this.data[0];

    // 情况3 至少2个元素
    // 1 先保存要返回的最小值 堆顶
    let min = this.data[0];
    // 2 用最后一个元素，覆盖，然后删除末尾
    // 
    this.data[0] = this.data.pop();
    this._siftDown(0);
    return min;
  }
  // 向下沉淀，把下标i的元素调整
  _siftDown(i){
    let n = this.data.length;
    while(true){
      let l = (2*i)+1;
      let r = (2*i)+2;
      // smallest 表示 在 i l r 中值最小的那个下标
      // 先假设最小的是i自己
      let smallest = i;

      // 如果左子节点存在，且左子节点更小，则更新 smallest
      if(l<n && this.data[l] < this.data[smallest]) smallest = l;
      // 如果右子节点存在，且更小，则更新smallest 
      if(r<n && this.data[r] < this.data[smallest]) smallest = r;
      // 如果最小的依然是自己
      // 说明当前节点 小于等于两个字节点 如果存在
      if(smallest === 1) break;
      // 否则 交换当前节点和最小的节点。
      this._swap(i,smallest);
      // 最小节点移动
      i = smallest;
    }
  }
}









