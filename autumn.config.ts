import { feature, product, featureItem, priceItem } from "atmn";

export const dataTransfers = feature({
  id: "data_transfers",
  name: "Data Transfers (GB)",
  type: "single_use",
});

export const pivotPoints = feature({
  id: "pivot_points",
  name: "Pivot Points",
  type: "single_use",
});

export const udiDevices = feature({
  id: "udi_devices",
  name: "UDI Devices",
  type: "continuous_use",
});

export const basicRechargePlans = feature({
  id: "basic_recharge_plans",
  name: "Basic Recharge Plans",
  type: "boolean",
});

export const customRechargeBuilder = feature({
  id: "custom_recharge_builder",
  name: "Custom Recharge Plan Builder",
  type: "boolean",
});

export const advancedRechargeAi = feature({
  id: "advanced_recharge_ai",
  name: "Advanced Recharge Plan Builder with AI",
  type: "boolean",
});

export const standardSpeed = feature({
  id: "standard_speed",
  name: "Standard Transfer Speed",
  type: "boolean",
});

export const prioritySpeed = feature({
  id: "priority_speed",
  name: "Priority Transfer Speed",
  type: "boolean",
});

export const transactionExport = feature({
  id: "transaction_export",
  name: "Transaction History Export",
  type: "boolean",
});

export const prioritySupport = feature({
  id: "priority_support",
  name: "Priority Support",
  type: "boolean",
});

export const analyticsDashboard = feature({
  id: "analytics_dashboard",
  name: "Advanced Analytics Dashboard",
  type: "boolean",
});

export const free = product({
  id: "free",
  name: "Free Plan",
  is_default: true,
  items: [
    featureItem({
      feature_id: dataTransfers.id,
      included_usage: 5,
      interval: "month",
    }),
    featureItem({
      feature_id: pivotPoints.id,
      included_usage: 100,
      interval: "month",
    }),
    featureItem({
      feature_id: basicRechargePlans.id,
    }),
    featureItem({
      feature_id: udiDevices.id,
      included_usage: 3,
    }),
  ],
});

export const starter = product({
  id: "starter",
  name: "Starter Plan",
  items: [
    priceItem({
      price: 9.99,
      interval: "month",
    }),
    featureItem({
      feature_id: dataTransfers.id,
      included_usage: 50,
      interval: "month",
    }),
    featureItem({
      feature_id: pivotPoints.id,
      included_usage: 500,
      interval: "month",
    }),
    featureItem({
      feature_id: customRechargeBuilder.id,
    }),
    featureItem({
      feature_id: udiDevices.id,
      included_usage: 10,
    }),
    featureItem({
      feature_id: standardSpeed.id,
    }),
  ],
});

export const pro = product({
  id: "pro",
  name: "Pro Plan",
  items: [
    priceItem({
      price: 24.99,
      interval: "month",
    }),
    featureItem({
      feature_id: dataTransfers.id,
      included_usage: 200,
      interval: "month",
    }),
    featureItem({
      feature_id: pivotPoints.id,
      included_usage: 2000,
      interval: "month",
    }),
    featureItem({
      feature_id: advancedRechargeAi.id,
    }),
    featureItem({
      feature_id: udiDevices.id,
    }),
    featureItem({
      feature_id: prioritySpeed.id,
    }),
    featureItem({
      feature_id: transactionExport.id,
    }),
  ],
});

export const unlimited = product({
  id: "unlimited",
  name: "Unlimited Plan",
  items: [
    priceItem({
      price: 49.99,
      interval: "month",
    }),
    featureItem({
      feature_id: dataTransfers.id,
    }),
    featureItem({
      feature_id: pivotPoints.id,
      included_usage: 5000,
      interval: "month",
    }),
    featureItem({
      feature_id: advancedRechargeAi.id,
    }),
    featureItem({
      feature_id: udiDevices.id,
    }),
    featureItem({
      feature_id: prioritySpeed.id,
    }),
    featureItem({
      feature_id: transactionExport.id,
    }),
    featureItem({
      feature_id: prioritySupport.id,
    }),
    featureItem({
      feature_id: analyticsDashboard.id,
    }),
  ],
});