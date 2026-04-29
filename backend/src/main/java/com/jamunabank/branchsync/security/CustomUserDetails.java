package com.jamunabank.branchsync.security;

import com.jamunabank.branchsync.model.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final String employeeId;
    private final String password;
    private final Long branchId;
    private final Collection<? extends GrantedAuthority> authorities;

    public static CustomUserDetails build(User user) {
        // Replace spaces with underscores and prefix with "ROLE_"
        String roleName = "ROLE_" + user.getRole().getRoleName().replace(" ", "_").toUpperCase();
        GrantedAuthority authority = new SimpleGrantedAuthority(roleName);
        System.out.println("DEBUG: Mapping database role '" + user.getRole().getRoleName() + "' to Spring Authority: " + roleName);

        return new CustomUserDetails(
                user.getUserId(),
                user.getEmployeeId(),
                user.getPasswordHash(),
                user.getBranch() != null ? user.getBranch().getBranchId() : null,
                Collections.singletonList(authority)
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return employeeId; // Using employeeId as the principal identifier
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
