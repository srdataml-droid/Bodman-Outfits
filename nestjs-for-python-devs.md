# NestJS for FastAPI Developers — A Translation Guide

You already know backend engineering. This isn't teaching you new
concepts — it's translating concepts you already use daily into new
syntax, so when Codex generates NestJS code, you can read it like
"oh, that's just X, I know this" instead of it feeling foreign.

## The one thing that's already identical: async/await

Good news first: TypeScript uses the exact same `async`/`await`
keywords, the exact same way, as Python. This code:

```python
async def get_order(order_id: str):
    order = await db.orders.find_one(order_id)
    return order
```

looks almost identical in TypeScript:

```typescript
async getOrder(orderId: string) {
  const order = await this.prisma.order.findUnique({ where: { id: orderId } });
  return order;
}
```

The mental model — "pause here until this finishes, then continue" —
transfers over completely unchanged.

---

## 1. Project structure: routers vs. modules

**FastAPI**: you probably organize with `APIRouter()` per resource,
included into the main app.

```python
# orders/router.py
router = APIRouter(prefix="/orders")

@router.get("/")
async def list_orders():
    ...
```

**NestJS**: same idea, but every resource gets 3 files that work
together instead of 1:

| File | FastAPI equivalent |
|---|---|
| `orders.controller.ts` | Your `router.py` — defines the routes/endpoints |
| `orders.service.ts` | The actual business logic (often mixed into your route functions in FastAPI) |
| `orders.module.ts` | Registers the above two with the app — like `app.include_router(router)` |

This 3-file split feels like more ceremony at first, but it's the
same separation you'd get if you split your FastAPI route functions
into "the route" and "a separate function that does the real work" —
NestJS just enforces that split as a convention.

📖 [NestJS Controllers docs](https://docs.nestjs.com/controllers) · [NestJS Providers/Services docs](https://docs.nestjs.com/providers)

---

## 2. Route decorators — nearly 1:1

```python
@router.post("/orders/{order_id}/status")
async def update_status(order_id: str, body: StatusUpdate):
    ...
```

```typescript
@Put('orders/:id/status')
updateStatus(@Param('id') id: string, @Body() body: StatusUpdateDto) {
  ...
}
```

Read `@Param('id')` as "this is a path parameter" (like FastAPI's
`order_id: str` in the path), and `@Body()` as "parse the JSON body
into this shape" (like FastAPI's Pydantic body parameter). Same job,
decorator syntax instead of type-hint-in-signature syntax.

---

## 3. Validation: Pydantic vs. DTOs + class-validator

This is the biggest surface-level difference, but the concept is
identical: **define the expected shape of incoming data, and reject
anything that doesn't match.**

```python
class StatusUpdate(BaseModel):
    status: Literal["placed", "confirmed", "in_production", "ready", "delivered"]
    note: str | None = None
```

```typescript
export class StatusUpdateDto {
  @IsIn(['placed', 'confirmed', 'in_production', 'ready', 'delivered'])
  status: string;

  @IsOptional()
  @IsString()
  note?: string;
}
```

Read `@IsIn([...])` exactly like Pydantic's `Literal[...]` — "must be
one of these exact values." `@IsOptional()` is Pydantic's `| None`.
This project also uses Zod in some places — same job again, just a
schema-object style instead of decorators:

```typescript
const StatusUpdateSchema = z.object({
  status: z.enum(['placed', 'confirmed', 'in_production', 'ready', 'delivered']),
  note: z.string().optional(),
});
```

📖 [class-validator docs](https://github.com/typestack/class-validator) · [Zod docs](https://zod.dev/)

---

## 4. Dependency injection — same concept, opposite-feeling syntax

**FastAPI**: you explicitly call `Depends()` at the point of use.

```python
@router.get("/orders")
async def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()
```

**NestJS**: you declare what a class *needs* in its constructor, and
the framework hands it to you automatically — you never call
anything like `Depends()` yourself.

```typescript
@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async listOrders() {
    return this.prisma.order.findMany();
  }
}
```

The mental flip: in FastAPI, *you* ask for the dependency at each
route. In NestJS, you just declare "this class needs a
`PrismaService`" once in the constructor, and NestJS wires it in
everywhere that class is used. This is also the #1 error you'll see
— **"Nest can't resolve dependencies of X"** always means you asked
for something in a constructor that NestJS doesn't know how to
provide — check the relevant `.module.ts` file's `providers` array.

📖 [NestJS Dependency Injection docs](https://docs.nestjs.com/providers#dependency-injection)

---

## 5. Database: SQLAlchemy vs. Prisma

```python
order = db.query(Order).filter(Order.id == order_id).first()
```

```typescript
const order = await this.prisma.order.findUnique({ where: { id: orderId } });
```

Same job. Prisma's big win over SQLAlchemy: your database schema
(`schema.prisma`) auto-generates fully-typed query methods — so
`prisma.order.findUnique(...)` already knows exactly what fields
`Order` has, with autocomplete, before you even run anything. Think
of it as SQLAlchemy models + Pydantic validation fused into one file
that generates both automatically.

📖 [Prisma Client docs](https://www.prisma.io/docs/orm/prisma-client/queries/crud)

---

## 6. Auth guard: FastAPI's `Depends(get_current_user)` vs. NestJS Guards

```python
@router.get("/admin/orders")
async def list_orders(user: User = Depends(get_current_admin)):
    ...
```

```typescript
@UseGuards(AdminAuthGuard)
@Get('admin/orders')
listOrders() {
  ...
}
```

Same concept — "run this check before the route body executes, and
reject if it fails" — just declared as a decorator above the route
instead of a dependency parameter inside it.

📖 [NestJS Guards docs](https://docs.nestjs.com/guards)

---

## 7. Config/environment variables

```python
class Settings(BaseSettings):
    database_url: str
    ollama_api_key: str
```

```typescript
// via @nestjs/config, then:
this.configService.get<string>('OLLAMA_API_KEY')
```

Same job as Pydantic's `BaseSettings` — reads from `.env`, gives you
one place to see every required variable.

📖 [NestJS Configuration docs](https://docs.nestjs.com/techniques/configuration)

---

## Quick reading checklist for any NestJS file Codex hands you

1. **See `@Injectable()` on a class?** → this is a service, like a
   Python class whose methods your routes call into.
2. **See `@Controller()` on a class?** → this is your router file —
   look at the methods below it for the actual endpoints.
3. **See something in a constructor `(private thing: ThingService)`?**
   → this class depends on `ThingService`, same as a FastAPI
   `Depends()` parameter — NestJS just wires it automatically.
4. **See a class ending in `Dto` or `Schema`?** → this is the
   Pydantic-model equivalent — the expected shape of incoming data.
5. **See `@UseGuards(...)` above a route?** → this is the auth check,
   same job as a FastAPI `Depends(get_current_user)`.

Once these five patterns click, most NestJS code reads like Python
with different punctuation — not a different way of thinking.
