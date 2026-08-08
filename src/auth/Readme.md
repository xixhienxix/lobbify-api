# Backend Usuarios CRUD — Notes

## What was added to `user.service.ts`
Everything above the "New CRUD methods" comment is byte-for-byte what you
already had — nothing about `login`, `autoriza`, or `loginFromAdmin` changed.
Added below it:

- `findById(id)` — GET one
- `create(usuarioData)` — POST
- `update(id, usuarioData)` — PUT
- `remove(id)` — DELETE

## `users.controller.ts` — new file, needs wiring
This controller doesn't exist yet in what you shared. Add it to whichever
module currently provides `UserService`:

```typescript
@Module({
  controllers: [UsersController], // add this
  providers: [UserService],
  // ...
})
export class UserModule {}
```

Routes will land on `/usuarios`, `/usuarios/:id` — matching what
`usuarios.service.ts` on the frontend already calls.

## Decisions I made — override any of these if they don't fit

**1. Password stays plain text on create/update.**
Your `login()` and `autoriza()` both do
`findOne({ username, password: plainTextPassword })` — a direct plaintext
comparison. If `create()`/`update()` hashed the password instead, login would
break for anyone created/edited through this catalog. I kept it consistent
with your existing auth flow rather than silently breaking logins. If you
want to move to hashing, that's a bigger change — it means updating `login()`
and `autoriza()` to use `bcrypt.compare()` against `passwordHash` instead,
and probably a migration for existing plaintext passwords. Happy to do that
as a separate step if you want it.

**2. `findAll`/`findById` strip `password`, `passwordHash`, `accessToken`.**
Added `.select('-password -passwordHash -accessToken')` so the catalog table
never receives sensitive fields over the wire. `create()` strips the same
fields before returning the saved doc.

**3. `username` is immutable on `update()`.**
The endpoint silently drops `username` from the update payload even if the
frontend sends it (it does, but disabled/read-only, so it always sends the
original value anyway — this is just defense in depth). Since `username` is
the login key for `login()`/`autoriza()`, allowing it to change here would
need cascading updates in the frontend's disabled-field logic and possibly a
"rename" flow instead of a plain PATCH.

**4. Blank password on `update()` = "leave unchanged."**
Matches how the frontend form works: password field is optional on edit.

**5. Basic validation, not full `class-validator` DTOs.**
`create()` throws `ConflictException` if `username`/`email`/`password` are
missing, and checks for a duplicate `username`. `findById`/`update`/`remove`
throw `NotFoundException` for bad/missing ids (including invalid ObjectId
format, which would otherwise throw an ugly Mongoose cast error). If your
project already uses `class-validator` DTOs elsewhere, it'd be more
consistent to wrap `Partial<usuario>` in a proper `CreateUsuarioDto` /
`UpdateUsuarioDto` — didn't do that here since I don't have a DTO pattern
from your other modules to match.