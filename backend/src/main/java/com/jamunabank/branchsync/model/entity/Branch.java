package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.BranchType;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "branches")
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "branch_code", nullable = false, unique = true, length = 20)
    private String branchCode;

    @Column(name = "branch_name", nullable = false, length = 150)
    private String branchName;

    @Enumerated(EnumType.STRING)
    @Column(name = "branch_type", nullable = false)
    private BranchType branchType;

    @Column(name = "address")
    private String address;

    @Column(name = "district")
    private String district;

    @Column(name = "division")
    private String division;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime createdAt;

    public Branch() {}

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public BranchType getBranchType() { return branchType; }
    public void setBranchType(BranchType branchType) { this.branchType = branchType; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    // Manual Builder static inner class
    public static class BranchBuilder {
        private Branch instance = new Branch();
        public BranchBuilder branchId(Long id) { instance.branchId = id; return this; }
        public BranchBuilder branchCode(String c) { instance.branchCode = c; return this; }
        public BranchBuilder branchName(String n) { instance.branchName = n; return this; }
        public BranchBuilder branchType(BranchType t) { instance.branchType = t; return this; }
        public BranchBuilder district(String d) { instance.district = d; return this; }
        public BranchBuilder division(String d) { instance.division = d; return this; }
        public BranchBuilder address(String a) { instance.address = a; return this; }
        public BranchBuilder phone(String p) { instance.phone = p; return this; }
        public BranchBuilder isActive(Boolean a) { instance.isActive = a; return this; }
        public BranchBuilder createdAt(OffsetDateTime c) { instance.createdAt = c; return this; }
        public Branch build() { return instance; }
    }
    public static BranchBuilder builder() { return new BranchBuilder(); }
}
