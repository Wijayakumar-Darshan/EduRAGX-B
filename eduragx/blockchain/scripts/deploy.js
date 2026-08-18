const hre = require("hardhat");

async function main() {
    console.log("Deploying AcademicRecord...");

    const signers = await hre.ethers.getSigners();

    if (signers.length === 0) {
        throw new Error(
            "No deployer account found. Check DEPLOYER_PRIVATE_KEY in .env"
        );
    }

    const deployer = signers[0];

    console.log("Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(
        deployer.address
    );

    console.log(
        "Balance:",
        hre.ethers.formatEther(balance),
        "SepoliaETH"
    );

    const AcademicRecord =
        await hre.ethers.getContractFactory("AcademicRecord");

    const contract = await AcademicRecord.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("AcademicRecord deployed to:");
    console.log(address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});