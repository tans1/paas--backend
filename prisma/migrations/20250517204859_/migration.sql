-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL,
    "containerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cpuSeconds" DOUBLE PRECISION NOT NULL,
    "memoryBytes" BIGINT NOT NULL,
    "netRxBytes" BIGINT NOT NULL,
    "netTxBytes" BIGINT NOT NULL,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAggregate" (
    "id" TEXT NOT NULL,
    "containerName" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalCpuSecs" DOUBLE PRECISION NOT NULL,
    "totalMemGbHrs" DOUBLE PRECISION NOT NULL,
    "totalNetBytes" BIGINT NOT NULL,

    CONSTRAINT "MonthlyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
