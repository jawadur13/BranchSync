package com.jamunabank.branchsync.security;

import com.jamunabank.branchsync.model.entity.User;
import com.jamunabank.branchsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String employeeId) throws UsernameNotFoundException {
        User user = userRepository.findByEmployeeIdWithRole(employeeId)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with employeeId: " + employeeId));

        return CustomUserDetails.build(user);
    }
}
