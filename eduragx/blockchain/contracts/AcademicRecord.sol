// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AcademicRecord {

    struct Record {
        string studentId;
        string reportHash;
        string reportType;
        uint256 issuedAt;
        address issuer;
        bool revoked;
    }

    uint256 private recordCounter;

    address public owner;

    mapping(uint256 => Record) private records;
    mapping(string => uint256[]) private studentRecords;

    event RecordAdded(
        uint256 indexed recordId,
        string indexed studentId,
        string reportHash,
        uint256 timestamp,
        address issuer
    );

    event RecordRevoked(
        uint256 indexed recordId,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addRecord(
        string calldata studentId,
        string calldata reportHash,
        string calldata reportType
    ) external onlyOwner returns (uint256) {

        recordCounter++;

        records[recordCounter] = Record({
            studentId: studentId,
            reportHash: reportHash,
            reportType: reportType,
            issuedAt: block.timestamp,
            issuer: msg.sender,
            revoked: false
        });

        studentRecords[studentId].push(recordCounter);

        emit RecordAdded(
            recordCounter,
            studentId,
            reportHash,
            block.timestamp,
            msg.sender
        );

        return recordCounter;
    }

    function getRecord(
        uint256 recordId
    )
        external
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            address,
            bool
        )
    {
        require(
            recordId > 0 && recordId <= recordCounter,
            "Invalid record"
        );
        
        Record memory r = records[recordId];

        return (
            r.studentId,
            r.reportHash,
            r.reportType,
            r.issuedAt,
            r.issuer,
            r.revoked
        );
    }

    function verifyRecordView(
        uint256 recordId,
        string calldata hashToCheck
    ) external view returns (bool) {

        Record memory r = records[recordId];

        return (
            !r.revoked &&
            keccak256(bytes(r.reportHash)) ==
            keccak256(bytes(hashToCheck))
        );
    }

    function getStudentRecordIds(
        string calldata studentId
    ) external view returns (uint256[] memory) {
        return studentRecords[studentId];
    }

    function totalRecords() external view returns (uint256) {
        return recordCounter;
    }

    function revokeRecord(
        uint256 recordId
    ) external onlyOwner {

        require(recordId > 0 && recordId <= recordCounter, "Invalid record");

        records[recordId].revoked = true;

        emit RecordRevoked(
            recordId,
            block.timestamp
        );
    }
}