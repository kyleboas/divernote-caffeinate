# divernote-caffeinate

Keeps a Mac from sleeping while it is plugged in, so it is always there to run Divernote issues.

```
/extension install git:github.com/kyleboas/divernote-caffeinate
```

Run that twice: a computer looks up the version, then the second run confirms it. Turn it on or off in `/settings`, on any device. A change takes effect within 15 seconds.

While it is on, the worker holds `caffeinate -s`. The display still sleeps. On battery the Mac sleeps as usual, and a closed lid without an external display may still sleep it. It does nothing on other systems. After `/extension remove`, the hold ends when the worker next restarts, so turn it off first to end it at once.

It needs a Divernote worker with the `worker-tick` hook.
