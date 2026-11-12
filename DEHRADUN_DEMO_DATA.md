# Dehradun SmartBus demo data

The bundled `backend/instance/smartbus.db` now contains 8 additional sample buses,
8 assigned routes, and their ordered stops. The original sample bus is preserved.

## Re-seed / update the demo data

From the `backend` folder, run:

```bash
python seed_dehradun.py
```

The script is safe to run again. It updates these eight `DEH-SB-*` demo buses,
replaces their stops, and leaves unrelated records alone.

## Important

These are illustrative project/demo routes, stop sequences, departure times,
and estimated arrival offsets. They are not verified live public-transport
routes or official schedules. Confirm actual services and timings before
presenting them as real-world operating information.
