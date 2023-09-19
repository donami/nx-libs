const filterCssProps = (props: Record<string, any>) => {
  const cssProps: { [key: string]: any } = {};

  Object.keys(props).forEach((key) => {
    if (key.indexOf('css-') > -1) {
      cssProps[key] = props[key];
    }
  });

  return cssProps;
};

export const appendStyleFromProperties = (
  elem: HTMLElement,
  p: Record<string, any>
) => {
  const props = filterCssProps(p);
  Object.entries(props).forEach(([key, value]) => {
    elem.style.setProperty(key.replace('css-', ''), value);
  });
};

export default filterCssProps;
