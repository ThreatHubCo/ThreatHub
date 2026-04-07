When creating a new migration, create a file like `DD-MM-YY-Very-Short-Summary.sql` with your alter table queries etc, but **ALSO** modify `base.sql`.

On a fresh install, only `base.sql` will be run. On an existing install, each migration will be run in order.