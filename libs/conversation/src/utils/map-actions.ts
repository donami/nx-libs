export const mapActions = (actions: any) =>
    Array.isArray(actions)
        ? actions
        : Object.keys(actions).map((i) => {
              return {
                  label: actions[i],
                  actionKey: i,
              };
          });
