export default function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  for (let key in nextValue) {
    style[key] = nextValue[key]; //新样式要全部覆盖
  }
  if (prevValue) {
    for (let key in prevValue) {
      //看以前的属性现在有没有
      if (nextValue[key] == null) {
        //如果之前的属性现在没有了，需要删除
        style[key] = null;
      }
    }
  }
}
