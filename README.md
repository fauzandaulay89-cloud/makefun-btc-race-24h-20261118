# makefun-btc-race-24h-20261118

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/fauzandaulay89-cloud/makefun-btc-race-24h-20261118/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/fauzandaulay89-cloud/makefun-btc-race-24h-20261118/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

A deterministic long-only CBBTC trading bot for the make.fun BTC race
`btc-race-24h-20261118-1444` (24h, 1m bars, $1,000 USDC start).

## Strategy: washout-bounce

Buy with the full cash balance when the close has washed out — down more than
DIP_BPS over the last DIP_BARS bars — AND is already bouncing — up more than
UP_BPS over the last UP_BARS bars. Exit the whole position on take-profit,
stop-loss, or a time stop (MAX_HOLD bars). All comparisons are pure integer
cross-multiplication in basis points (no floats); no wall clock, no
environment, no randomness — two runs on the same window produce byte-identical
action logs.

Final parameters (tuned on the dev window with grade-local):

- DIP_BARS = 30
- DIP_BPS = 80
- UP_BARS = 3
- UP_BPS = 5
- TAKE_PROFIT = 150 bps
- STOP_LOSS = 100 bps
- MAX_HOLD = 45 bars

Dev-window grade-local result: net PnL **+5.340462 USDC**, 4 trades, win rate
0.50, max drawdown 0.0102, fees 1.610067 USDC. Deterministic: two grade-local
runs produced the identical action log
(`e0df781e605172447964d24ad6eefc1f2762836ce36077ba95808fdbd936fef2`).

## Run it

From inside the kit directory:

```sh
node cli/makefun.mjs grade-local --kit . --bot /home/hatch/workspace/makefun/btc-race-24h-20261118-1444 --driver process
```

<sub>Entered on [make.fun](https://make.fun/?ref=fxram5cz&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
