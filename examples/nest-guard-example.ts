import { CanActivate, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { GuardStackNestGuard } from "guard-stack";

const guard = new GuardStackNestGuard({
  currentService: "service-b",
  trustedIssuers: {
    "service-a": process.env.SERVICE_A_SECRET ?? ""
  }
});

@Controller()
class PaymentsController {
  @Post("/payments/create")
  @UseGuards(guard as unknown as CanActivate)
  create(@Req() request: { guardStack?: unknown }) {
    return {
      ok: true,
      tokenPayload: request.guardStack
    };
  }
}
