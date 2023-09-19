const mapValue = (value: any, cssVar: string, el: HTMLElement) => {
  if (value) {
    el.style.setProperty(cssVar, value);
  }
};

export const mapBranding = (context: Record<string, any>, el: HTMLElement) => {
  mapValue(context.colors?.primary, '--primary-color', el);
  mapValue(context.colors?.secondary, '--secondary-color', el);
  mapValue(context.colors?.text, '--text-color', el);
  mapValue(context.colors?.link, '--link-color', el);
  mapValue(context.colors?.gray, '--gray-color', el);
  mapValue(context.colors?.grayDark, '--gray-dark-color', el);

  mapValue(context.spacing?.xs, '--spacing-xs', el);
  mapValue(context.spacing?.sm, '--spacing-sm', el);
  mapValue(context.spacing?.md, '--spacing-md', el);
  mapValue(context.spacing?.lg, '--spacing-lg', el);
  mapValue(context.spacing?.xl, '--spacing-xl', el);

  mapValue(context.boxShadow, '--box-shadow', el);
  mapValue(context.borderRadius, '--border-radius', el);
  mapValue(context.borderRadiusSm, '--border-radius-sm', el);
  mapValue(context.fontFamily, '--font-family', el);
};
