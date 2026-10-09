# ERROR LOG.

1. The following eerror was encountered when trying to compile the solidity contract:

    npx hardhat compile
    ◇ injected env (3) from .env
    ParserError: Expected "from".
    --> contracts/Ziwachain.sol:6:18:
    |
    6 | import {ERC1155} FROM "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
    |                  ^^^^


    Error HH600: Compilation failed

    For more info go to https://v2.hardhat.org/HH600 or run Hardhat with --show-stack-traces

- The 'ParserError' means that the compiler could not read the file as valid Solidity.

    import {ERC1155} FROM "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

    <!-- the error cam from the line aboe, as Solidity is case-sensitive, the capital FROM is wrong, on changing it to small letters it compiles successfully. -->


2. On runnng the command below, this is what the terminal showed:

    npx hardhat compile
    ◇ injected env (3) from .env
    Warning: SPDX license identifier not provided in source file. Before publishing, consider adding a comment containing "SPDX-License-Identifier: <SPDX-License>" to each source file. Use "SPDX-License-Identifier: UNLICENSED" for non-open-source code. Please see https://spdx.org for more information.
    --> contracts/Ziwachain.sol


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:402:13:
        |
    402 |             mcopy(add(result, 0x20), add(add(array, 0x20), mul(start, 0x20)), mul(sub(end, start), 0x20))
        |             ^^^^^


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:432:13:
        |
    432 |             mcopy(add(result, 0x20), add(add(array, 0x20), mul(start, 0x20)), mul(sub(end, start), 0x20))
        |             ^^^^^


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:462:13:
        |
    462 |             mcopy(add(result, 0x20), add(add(array, 0x20), mul(start, 0x20)), mul(sub(end, start), 0x20))
        |             ^^^^^


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:492:13:
        |
    492 |             mcopy(add(array, 0x20), add(add(array, 0x20), mul(start, 0x20)), mul(sub(end, start), 0x20))
        |             ^^^^^


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:540:13:
        |
    540 |             mcopy(
        |             ^^^^^


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:574:13:
        |
    574 |             mcopy(add(array, 0x20), add(add(array, 0x20), mul(start, 0x20)), mul(sub(end, start), 0x20))
        |             ^^^^^


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:622:13:
        |
    622 |             mcopy(
        |             ^^^^^


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:656:13:
        |
    656 |             mcopy(add(array, 0x20), add(add(array, 0x20), mul(start, 0x20)), mul(sub(end, start), 0x20))
        |             ^^^^^


    TypeError: The "mcopy" instruction is only available for Cancun-compatible VMs (you are currently compiling for "paris").
    --> @openzeppelin/contracts/utils/Arrays.sol:704:13:
        |
    704 |             mcopy(
        |             ^^^^^


    Error HH600: Compilation failed

    For more info go to https://v2.hardhat.org/HH600 or run Hardhat with --show-stack-traces

- The error is because the compiler was set to an oldr version of the EVM running the smart contracts, to fix this, inside the hardhat.config.ts change the line from:

     solidity: "0.8.28",

      solidity: {
    version: "0.8.28",
    settings: { evmVersion: "cancun" },
     },