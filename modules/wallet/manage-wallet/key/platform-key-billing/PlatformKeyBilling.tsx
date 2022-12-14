import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { Sats } from "modules/shared/components/sats/Sats";
import { GetPlatformKeyBillingQuery } from "modules/shared/graphql/client";
import { FC } from "react";

export const PlatformKeyBilling: FC<{
  platformKeyBilling: NonNullable<
    GetPlatformKeyBillingQuery["platformKeyBilling"]
  >;
}> = ({ platformKeyBilling }) => {
  return (
    <Stack gap={2}>
      <Typography>
        Billing address {platformKeyBilling.billingAddress}
      </Typography>
      <Typography>
        Paid until {dayjs(platformKeyBilling.paidUntil).format("YYYY-MM-DD")}
      </Typography>
      {platformKeyBilling.billing.length !== 0 && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Amount paid</TableCell>
                <TableCell>Price per month</TableCell>
                <TableCell>Months paid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {platformKeyBilling.billing.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Sats amount={item.amountPaid} />
                  </TableCell>
                  <TableCell>
                    <Sats amount={item.discountPrice} />
                  </TableCell>
                  <TableCell>{item.monthsPaid}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
};
