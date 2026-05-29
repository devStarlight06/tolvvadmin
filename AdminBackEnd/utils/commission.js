const ADMIN_COMMISSION_PERCENT = 10; // change if needed

function calculateCommission(items) {
  const companyMap = {};
  let totalAdminCommission = 0;

  items.forEach(item => {
    const total = item.price * item.qty;

    if (!companyMap[item.company]) {
      companyMap[item.company] = 0;
    }

    companyMap[item.company] += total;
  });

  const companyBreakdown = Object.keys(companyMap).map(company => {
    const companyTotal = companyMap[company];
    const adminCommission = (companyTotal * ADMIN_COMMISSION_PERCENT) / 100;
    const vendorAmount = companyTotal - adminCommission;

    totalAdminCommission += adminCommission;

    return {
      company,
      companyTotal,
      adminCommission,
      vendorAmount
    };
  });

  return { companyBreakdown, totalAdminCommission };
}

module.exports = calculateCommission;
