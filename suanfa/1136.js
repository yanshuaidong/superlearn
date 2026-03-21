
var MyStack = function () {
  this.arr1 = [];
  this.arr2 = [];
};

/** 
* @param {number} x
* @return {void}
*/
MyStack.prototype.push = function (x) {
  this.arr1.unshift(x);
};

/**
* @return {number}
*/
MyStack.prototype.pop = function () {
  let size = this.arr1.length;
  for (let i = 0; i < size - 1; i++) {
      this.arr2.unshift(this.arr1.pop())
  }
  let res = this.arr1.pop()
  let size2 = this.arr2.length;
  for (let i = 0; i < size2; i++) {
      this.arr1.unshift(this.arr2.pop())
  }
  return res;
};

/**
* @return {number}
*/
MyStack.prototype.top = function () {
  return this.arr1[0];
};

/**
* @return {boolean}
*/
MyStack.prototype.empty = function () {
  return this.arr1.length === 0 ? true : false;
};


var obj = new MyStack()
obj.push(1)
obj.push(2)
var param_3 = obj.top()
var param_2 = obj.pop()
var param_4 = obj.empty()
