export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'execute' : IDL.Func([], [], []),
    'getValue' : IDL.Func([], [IDL.Nat], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
