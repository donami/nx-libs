type LayoutSettings = {
  values: Record<string, string>;
  breakpoints?: string[];
};

export const getLayoutProps = (
  settings: LayoutSettings[],
  activeBreakpoints: string[],
  hasTrigger: boolean = false
) => {
  const layoutProps = settings.reduce<Record<string, string>>(
    (acc, { breakpoints = [], values }) => {
      if (!breakpoints.length) {
        return { ...acc, ...values };
      }

      if (
        activeBreakpoints.some((breakpoint) => breakpoints.includes(breakpoint))
      ) {
        return { ...acc, ...values };
      }
      return acc;
    },
    {}
  );

  const styles: Record<string, string> = {};
  let type = layoutProps.type;

  styles.height = layoutProps.height || '';
  styles.width = layoutProps.width || '';

  if (layoutProps.type === 'floating') {
  } else if (layoutProps.type === 'inline') {
    if (hasTrigger) {
      styles['height'] = 'calc(100vh - 120px)';
    }
  }
  return { type, styles };
};
