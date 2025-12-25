import { isString } from "@vue/shared";

export default function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  const isCssString = isString(nextValue);
  if (nextValue && !isCssString) {
    for (let key in nextValue) {
      setStyle(style, key, nextValue[key]); //新样式要全部覆盖
    }
  }

  if (prevValue && !isCssString) {
    for (let key in prevValue) {
      //看以前的属性现在有没有
      if (nextValue[key] == null) {
        //如果之前的属性现在没有了，需要删除
        setStyle(style, key, "");
      }
    }
  }
}

function setStyle(style: CSSStyleDeclaration, key: string, value: string) {
  style[key] = value;
}
