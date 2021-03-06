﻿using Foundation.Core.Contracts;
using Foundation.DataAccess.Contracts.EntityFrameworkCore;
using Foundation.DataAccess.Implementations.EntityFrameworkCore;
using Foundation.Model.DomainModels;
using Foundation.Test.Model.DomainModels;
using Microsoft.EntityFrameworkCore;

namespace Foundation.Test.DataAccess.Implementations
{
    public class TestDbContext : DefaultDbContext
    {
        protected TestDbContext()
            : base()
        {

        }

        public TestDbContext(DbContextOptions options)
            : base(options)
        {
        }

        public TestDbContext(IAppEnvironmentProvider appEnvironmentProvider, IDbContextObjectsProvider dbContextCreationOptionsProvider)
              : base(appEnvironmentProvider.GetActiveAppEnvironment().GetConfig<string>("TestDbConnectionString"), dbContextCreationOptionsProvider)
        {

        }

        public virtual DbSet<UserSetting> UsersSettings { get; set; }

        public virtual DbSet<TestModel> TestModels { get; set; }

        public virtual DbSet<ParentEntity> ParentEntities { get; set; }

        public virtual DbSet<ChildEntity> ChildEntities { get; set; }

        public virtual DbSet<TestCustomer> TestCustomers { get; set; }

        public virtual DbSet<TestCity> TestCities { get; set; }
    }
}
